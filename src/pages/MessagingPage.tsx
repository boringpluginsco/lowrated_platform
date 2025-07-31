import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Conversation,
  ConversationList,
  Message as CSMessage,
  MessageList,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";
import type { Business, Message } from "../types";
import { useTheme } from "../context/ThemeContext";
import emailService, { type EmailRequest } from "../services/emailService";
import {
  saveBusinessStages,
  loadBusinessStages,
  saveEmailThreads,
  loadEmailThreads,
} from "../utils/persistence";

type BusinessStage = "New" | "Contacted" | "Engaged" | "Qualified" | "Converted";

interface Props {
  businesses: Business[];
  messagesByBusiness: Record<string, Message[]>;
  sendMessage: (bizId: string, text: string) => void;
}

export default function MessagingPage({
  businesses,
  messagesByBusiness,
  sendMessage,
}: Props) {
  const { isDarkMode } = useTheme();
  const [searchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<string | null>(
    businesses[0]?.id ?? null
  );
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"timeline" | "message" | "email" | "mailmerge">(
    "timeline"
  );
  const [activeTab, setActiveTab] = useState<BusinessStage>("New");
  const [businessStages, setBusinessStages] = useState<
    Record<string, BusinessStage>
  >(() => {
    // Load persisted stages or initialize as 'New'
    const persistedStages = loadBusinessStages();
    const initialStages: Record<string, BusinessStage> = {};
    businesses.forEach((business) => {
      initialStages[business.id] =
        (persistedStages[business.id] as BusinessStage) || "New";
    });
    return initialStages;
  });
  const [emailForm, setEmailForm] = useState({
    from: "jordan@galleongroup.co",
    to: "",
    subject: "",
    body: "",
  });
  const [availableEmails, setAvailableEmails] = useState<
    { businessId: string; emails: string[] }[]
  >([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState<string | null>(null);
  const [emailThreads, setEmailThreads] = useState<
    {
      businessId: string;
      emails: {
        id: string;
        from: string;
        to: string;
        subject: string;
        body: string;
        timestamp: Date;
        direction: "sent" | "received";
      }[];
    }[]
  >(() => loadEmailThreads());
  const [isComposing, setIsComposing] = useState(true);
  const [draggedBusinessId, setDraggedBusinessId] = useState<string | null>(
    null
  );
  const [dragOverTab, setDragOverTab] = useState<BusinessStage | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });
  const [mailMergeForm, setMailMergeForm] = useState({
    from: "jordan@galleongroup.co",
    to: "<<email>>",
    subject: "Regarding your business listing",
    body: `Hi <<contact_name>>,

I noticed your business <<business_name>> has a rating of <<rating>> on Google. I wanted to reach out to discuss how we might be able to help improve your online presence.

Best regards,
Jordan`,
  });
  const [hoveredBusiness, setHoveredBusiness] = useState<
    (typeof filteredBusinesses)[0] | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Function to replace placeholders with actual business data
  const replacePlaceholders = (
    text: string,
    business: (typeof filteredBusinesses)[0] | null
  ): string => {
    if (!business) return text;

    // Get email for this business
    let email;
    if (business.email_1) {
      email = business.email_1;
    } else if (business.domain) {
      const cleanDomain = business.domain
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");
      email = `info@${cleanDomain}`;
    } else {
      email = `contact@${business.name.toLowerCase().replace(/\s+/g, "")}.com`;
    }

    const contactName = business.name.split(" ")[0] + " Manager";

    return text
      .replace(/<<business_name>>/g, business.name)
      .replace(/<<contact_name>>/g, contactName)
      .replace(/<<rating>>/g, business.rating.toString())
      .replace(/<<email>>/g, email);
  };

  // Filter businesses based on active tab
  const filteredBusinesses = useMemo(() => {
    return businesses.filter(
      (business) => businessStages[business.id] === activeTab
    );
  }, [businesses, businessStages, activeTab]);

  // Function to move business to different stage
  const moveBusinessToStage = (businessId: string, newStage: BusinessStage) => {
    setBusinessStages((prev) => {
      const updated = {
        ...prev,
        [businessId]: newStage,
      };
      // Persist business stages
      saveBusinessStages(updated);
      return updated;
    });
  };

  // Ensure new businesses get initialized in stages
  useEffect(() => {
    const newBusinessIds = businesses
      .filter((b) => !businessStages[b.id])
      .map((b) => b.id);
    if (newBusinessIds.length > 0) {
      setBusinessStages((prev) => {
        const updated = { ...prev };
        newBusinessIds.forEach((id) => {
          updated[id] = "New";
        });
        saveBusinessStages(updated);
        return updated;
      });
    }
  }, [businesses, businessStages]);

  // Handle URL parameters for mode selection
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'email' || modeParam === 'mailmerge' || modeParam === 'timeline') {
      setMode(modeParam);
      if (modeParam === 'email') {
        setIsComposing(true);
        updateEmailRecipients();
      }
    }
  }, [searchParams]);

  // Update activeId when tab changes or filtered businesses change
  useEffect(() => {
    if (
      filteredBusinesses.length > 0 &&
      (!activeId || !filteredBusinesses.find((b) => b.id === activeId))
    ) {
      setActiveId(filteredBusinesses[0].id);
    } else if (filteredBusinesses.length === 0) {
      setActiveId(null);
    }
  }, [filteredBusinesses, activeId]);

  const msgs = activeId ? messagesByBusiness[activeId] || [] : [];

  const handleSend = () => {
    if (activeId && input.trim()) {
      sendMessage(activeId, input.trim());
      setInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const updateEmailRecipients = () => {
    // Use fetched email addresses if available, otherwise keep current value
    if (availableEmails.length > 0) {
      const firstEmail = availableEmails[0]?.emails[0];
      if (firstEmail) {
        setEmailForm((prev) => ({ ...prev, to: firstEmail }));
      }
    }
  };

  // Function to actually send email via Resend
  const handleSendRealEmail = async () => {
    if (!activeId || !emailForm.to || !emailForm.subject || !emailForm.body) {
      setEmailSendStatus({
        type: "error",
        message: "Please fill in all required fields (To, Subject, and Body)",
      });
      return;
    }

    // Validate email format
    if (!emailService.validateEmail(emailForm.to)) {
      setEmailSendStatus({
        type: "error",
        message: "Please enter a valid email address",
      });
      return;
    }

    setIsSendingEmail(true);
    setEmailSendStatus({ type: null, message: null });

    try {
      const emailData: EmailRequest = {
        to: emailForm.to,
        subject: emailForm.subject,
        body: emailForm.body,
        from: emailForm.from,
        fromName: "Jordan",
      };

      const response = await emailService.sendEmail(emailData);

      if (response.success) {
        // Add the sent email to the local thread
        const newEmail = {
          id: response.messageId || Date.now().toString(),
          from: emailForm.from,
          to: emailForm.to,
          subject: emailForm.subject,
          body: emailForm.body,
          timestamp: new Date(),
          direction: "sent" as const,
        };

        setEmailThreads((prev) => {
          const filtered = prev.filter(
            (thread) => thread.businessId !== activeId
          );
          const existingThread = prev.find(
            (thread) => thread.businessId === activeId
          );
          const updatedEmails = existingThread
            ? [...existingThread.emails, newEmail]
            : [newEmail];
          const updated = [
            ...filtered,
            { businessId: activeId, emails: updatedEmails },
          ];
          // Persist email threads
          saveEmailThreads(updated);
          return updated;
        });

        // Show success message
        setEmailSendStatus({
          type: "success",
          message: `Email sent successfully to ${emailForm.to} via Resend! Check the thread below.`,
        });

        // Clear the form
        setEmailForm((prev) => ({ ...prev, subject: "", body: "", to: "" }));

        // Close compose form after a brief delay to show success message
        setTimeout(() => {
          setIsComposing(false);
          setEmailSendStatus({ type: null, message: null });
        }, 2000);
      } else {
        setEmailSendStatus({
          type: "error",
          message: response.error || "Failed to send real email. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error sending real email:", error);
      setEmailSendStatus({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const closeEmailModal = () => {
    setMode("message");
  };

  const closeComposeForm = () => {
    setIsComposing(false);
  };

  const openComposeForm = () => {
    setIsComposing(true);
  };

  const handleDomainLookup = async (business: Business) => {
    if (!business.domain || business.domain === "-") {
      console.log("No domain available for this business");
      return;
    }

    setIsLoadingEmails(business.id);

    try {
      // Clean domain - remove http/https if present
      const cleanDomain = business.domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      const apiUrl = `https://aramexshipping.app.n8n.cloud/webhook/lookup-domain?domain=${cleanDomain}`;

      console.log("Making API call to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response data:", data);

      // Extract emails from the response
      let emails: string[] = [];
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        if (result.email1) emails.push(result.email1);
        if (result.email2) emails.push(result.email2);
      }

      // Update available emails for this business
      setAvailableEmails((prev) => {
        const filtered = prev.filter((item) => item.businessId !== business.id);
        return [...filtered, { businessId: business.id, emails }];
      });

      if (emails.length > 0) {
        // Set the first email as default in the To field
        setEmailForm((prev) => ({ ...prev, to: emails[0] }));
        console.log(`Found ${emails.length} email(s) for ${business.name}`);
      } else {
        console.log(`No emails found for ${business.name}`);
      }
    } catch (error) {
      console.error("Error fetching domain data:", error);
      console.log("Failed to fetch email addresses");
    } finally {
      setIsLoadingEmails(null);
    }
  };

  // Function to handle To field focus and trigger email lookup
  const handleToFieldFocus = () => {
    if (activeId) {
      const business = filteredBusinesses.find((b) => b.id === activeId);
      if (
        business &&
        !availableEmails.find((item) => item.businessId === business.id)
      ) {
        handleDomainLookup(business);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, businessId: string) => {
    setDraggedBusinessId(businessId);
    e.dataTransfer.setData("text/plain", businessId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedBusinessId(null);
    setDragOverTab(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: BusinessStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTab(stage);
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, stage: BusinessStage) => {
    e.preventDefault();
    const businessId = e.dataTransfer.getData("text/plain");
    if (businessId && draggedBusinessId) {
      moveBusinessToStage(businessId, stage);
      setActiveTab(stage); // Switch to the tab where business was moved
    }
    setDraggedBusinessId(null);
    setDragOverTab(null);
  };

  return businesses.length ? (
    <div
      className={`h-[calc(100vh-4rem)] shadow-inner font-mono ${
        isDarkMode ? "bg-background" : "bg-white"
      }`}
    >
      {/* Page Header */}
      <div
        className={`px-6 py-6 border-b ${
          isDarkMode ? "border-gray-600" : "border-gray-300"
        }`}
      >
        <h1
          className={`text-2xl font-bold mb-2 ${
            isDarkMode ? "text-text-primary" : "text-gray-900"
          }`}
        >
          Communication Center
        </h1>
        <p
          className={`text-sm ${
            isDarkMode ? "text-text-secondary" : "text-gray-600"
          }`}
        >
          Chat with your starred businesses or send emails
        </p>
      </div>

      {/* Tabs Navigation */}
      <div
        className={`px-6 py-4 border-b transition-all ${
          isDarkMode
            ? `bg-[#0D1125] border-gray-600 ${
                draggedBusinessId ? "bg-[#0F1530] shadow-lg" : ""
              }`
            : `bg-gray-50 border-gray-300 ${
                draggedBusinessId ? "bg-gray-100 shadow-lg" : ""
              }`
        }`}
      >
        <div className="flex space-x-1">
          {draggedBusinessId && (
            <div className="absolute -top-2 left-6 right-6 text-xs text-blue-400 font-medium animate-pulse">
              Drop on a tab to move business to that stage
            </div>
          )}
          {(
            ["New", "Contacted", "Engaged", "Qualified", "Converted"] as BusinessStage[]
          ).map((stage) => {
            const count = businesses.filter(
              (b) => businessStages[b.id] === stage
            ).length;
            const isDropTarget = dragOverTab === stage;
            const isDragActive = draggedBusinessId !== null;

            return (
              <button
                key={stage}
                onClick={() => setActiveTab(stage)}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  activeTab === stage
                    ? isDarkMode
                      ? "bg-accent text-background"
                      : "bg-blue-600 text-white"
                    : isDropTarget && isDragActive
                    ? "bg-blue-500 text-white transform scale-105"
                    : isDragActive
                    ? isDarkMode
                      ? "text-text-secondary hover:text-text-primary hover:bg-[#181B26] border-2 border-dashed border-gray-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200 border-2 border-dashed border-gray-400"
                    : isDarkMode
                    ? "text-text-secondary hover:text-text-primary hover:bg-[#181B26]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {isDropTarget && isDragActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                )}
                {stage}
                {count > 0 && (
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      activeTab === stage
                        ? isDarkMode
                          ? "bg-background text-accent"
                          : "bg-white text-blue-600"
                        : isDropTarget && isDragActive
                        ? "bg-white text-blue-500"
                        : isDarkMode
                        ? "bg-gray-600 text-gray-300"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex h-[calc(100%-200px)]">
        {/* Sidebar / Conversation List */}
        <div
          className={`flex-1 border-r overflow-y-auto ${
            isDarkMode ? "border-border bg-[#101322]" : "border-gray-300 bg-gray-50"
          }`}
        >
          <div
            className={`flex flex-col divide-y ${
              isDarkMode ? "divide-border" : "divide-gray-300"
            }`}
          >
            {filteredBusinesses.map((b) => (
              <div
                key={b.id}
                className={`flex items-center transition-all cursor-grab active:cursor-grabbing ${
                  draggedBusinessId === b.id
                    ? "opacity-50 transform scale-95"
                    : isDarkMode
                    ? "opacity-100 hover:bg-[#1a1d2b]"
                    : "opacity-100 hover:bg-gray-100"
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, b.id)}
                onDragEnd={handleDragEnd}
                title="Drag to move between stages"
              >
                {/* Drag Handle */}
                <div
                  className={`flex items-center justify-center w-6 transition-colors ${
                    isDarkMode
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="9" cy="5" r="1" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <circle cx="15" cy="5" r="1" />
                    <circle cx="15" cy="19" r="1" />
                  </svg>
                </div>

                <button
                  className={`flex-1 text-left px-3 py-3 transition-all ${
                    activeId === b.id
                      ? isDarkMode
                        ? "bg-[#4FF5AC] text-[#0B0E18] font-bold"
                        : "bg-blue-600 text-white font-bold"
                      : isDarkMode
                      ? "bg-transparent text-text-primary hover:bg-[#181B26] hover:text-accent"
                      : "bg-transparent text-gray-900 hover:bg-gray-200 hover:text-blue-600"
                  }`}
                  onClick={() => setActiveId(b.id)}
                >
                  <div
                    className={`text-base font-semibold truncate ${
                      activeId === b.id
                        ? isDarkMode
                          ? "text-[#0B0E18]"
                          : "text-white"
                        : ""
                    }`}
                  >
                    {b.name}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      activeId === b.id
                        ? isDarkMode
                          ? "text-[#0B0E18]"
                          : "text-white"
                        : isDarkMode
                        ? "text-text-secondary"
                        : "text-gray-600"
                    }`}
                  >
                    {b.city}
                  </div>
                </button>

                {/* Stage Dropdown */}
                <div className="relative group">
                  <button
                    className={`p-2 transition-colors ${
                      isDarkMode
                        ? "text-gray-400 hover:text-text-primary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute right-0 top-full mt-1 w-32 border rounded-md shadow-lg z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all ${
                      isDarkMode ? "bg-[#0D1125] border-gray-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <div className="py-1">
                      {(
                        ["New", "Contacted", "Engaged", "Qualified", "Converted"] as BusinessStage[]
                      ).map((stage) => (
                        <button
                          key={stage}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBusinessToStage(b.id, stage);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            businessStages[b.id] === stage
                              ? isDarkMode
                                ? "text-accent bg-[#181B26]"
                                : "text-blue-600 bg-blue-50"
                              : isDarkMode
                              ? "text-text-secondary hover:text-text-primary hover:bg-[#181B26]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          {stage}
                          {businessStages[b.id] === stage && (
                            <span
                              className={`ml-1 ${
                                isDarkMode ? "text-accent" : "text-blue-600"
                              }`}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Timeline, Message, Email, or MailMerge */}
        <div
          className={`fixed top-0 bottom-0 right-0 z-10 ${
            mode === "message" ? "w-[400px] max-w-[400px]" : 
            mode === "timeline" ? "w-[500px] max-w-[500px]" : 
            "w-[60%] max-w-[60%]"
          }`}
        >
          {mode === "timeline" ? (
            <>
              {/* Timeline Interface */}
              <div
                className={`w-full h-full flex flex-col shadow-lg overflow-hidden ${
                  isDarkMode ? "bg-[#181B26]" : "bg-white"
                }`}
              >
                {/* Timeline Header */}
                <div
                  className={`flex items-center justify-between px-6 py-6 border-b ${
                    isDarkMode ? "bg-[#181B26] border-gray-600" : "bg-white border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isDarkMode ? "bg-red-600" : "bg-red-100"
                      }`}
                    >
                      <svg
                        width="24"
                        height="24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        className={isDarkMode ? "text-red-400" : "text-red-600"}
                      >
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h2
                        className={`text-2xl font-bold ${
                          isDarkMode ? "text-text-primary" : "text-gray-900"
                        }`}
                      >
                        Contact Sequence
                      </h2>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-text-secondary" : "text-gray-600"
                        }`}
                      >
                        Timeline of all touchpoints with {activeId ? businesses.find(b => b.id === activeId)?.name : "selected business"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex flex-col items-center px-4 py-2 rounded-lg ${
                      isDarkMode ? "bg-red-600/10 border border-red-600/20" : "bg-red-50 border border-red-200"
                    }`}>
                      <span
                        className={`text-lg font-bold ${
                          isDarkMode ? "text-red-400" : "text-red-700"
                        }`}
                      >
                        {(() => {
                          const currentThread = emailThreads.find(thread => thread.businessId === activeId);
                          const messageCount = activeId ? (messagesByBusiness[activeId] || []).length : 0;
                          const emailCount = currentThread ? currentThread.emails.length : 0;
                          return messageCount + emailCount;
                        })()}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          isDarkMode ? "text-red-400/80" : "text-red-600"
                        }`}
                      >
                        Touchpoints
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {!activeId ? (
                    <div className="text-center py-24">
                      <div
                        className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      >
                        <svg
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          className={isDarkMode ? "text-gray-600" : "text-gray-400"}
                        >
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <p
                        className={`text-sm ${
                          isDarkMode ? "text-text-secondary" : "text-gray-600"
                        }`}
                      >
                        Select a business to view their contact timeline
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      {/* Timeline */}
                      <div className="relative">
                        {/* Timeline Line */}
                        <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${
                          isDarkMode ? "bg-gray-600" : "bg-gray-300"
                        }`}></div>
                        
                        {/* Timeline Items */}
                        <div className="space-y-6">
                          {(() => {
                            const currentThread = emailThreads.find(thread => thread.businessId === activeId);
                            const messages = activeId ? (messagesByBusiness[activeId] || []) : [];
                            const emails = currentThread ? currentThread.emails : [];
                            
                            // Combine and sort all touchpoints by timestamp
                            const allTouchpoints = [
                              ...messages.map(msg => ({
                                type: 'message' as const,
                                direction: msg.direction,
                                content: msg.text,
                                timestamp: new Date(msg.timestamp),
                                id: `msg-${msg.id}`
                              })),
                              ...emails.map(email => ({
                                type: 'email' as const,
                                direction: email.direction,
                                content: email.subject,
                                body: email.body,
                                timestamp: email.timestamp,
                                id: `email-${email.id}`
                              }))
                            ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                            if (allTouchpoints.length === 0) {
                              return (
                                <div className="text-center py-12">
                                  <div
                                    className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
                                      isDarkMode ? "bg-gray-800" : "bg-gray-100"
                                    }`}
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      className={isDarkMode ? "text-gray-600" : "text-gray-400"}
                                    >
                                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                  </div>
                                  <p
                                    className={`text-sm ${
                                      isDarkMode ? "text-text-secondary" : "text-gray-600"
                                    }`}
                                  >
                                    No touchpoints yet. Start your first conversation!
                                  </p>
                                </div>
                              );
                            }

                            return allTouchpoints.map((touchpoint, index) => (
                              <div key={touchpoint.id} className="relative flex items-start gap-4 group">
                                {/* Timeline Dot */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold z-10 shadow-lg transition-all duration-200 group-hover:scale-110 ${
                                  touchpoint.type === 'email' 
                                    ? touchpoint.direction === 'sent' 
                                      ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                                      : 'bg-gradient-to-br from-green-500 to-green-600'
                                    : touchpoint.direction === 'outgoing' 
                                      ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                                      : 'bg-gradient-to-br from-orange-500 to-orange-600'
                                }`}>
                                  {touchpoint.type === 'email' ? (
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                      <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                  ) : (
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                                    </svg>
                                  )}
                                </div>

                                {/* Content */}
                                <div className={`flex-1 p-5 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
                                  isDarkMode ? "bg-[#1a1d2b] border-gray-600 hover:border-gray-500" : "bg-white border-gray-200 hover:border-gray-300"
                                }`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                          touchpoint.type === 'email'
                                            ? touchpoint.direction === 'sent'
                                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                              : 'bg-green-100 text-green-700 border border-green-200'
                                            : touchpoint.direction === 'outgoing'
                                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                                        }`}
                                      >
                                        {touchpoint.type === 'email' 
                                          ? touchpoint.direction === 'sent' 
                                            ? '📧 Email Sent' 
                                            : '📥 Email Received'
                                          : touchpoint.direction === 'outgoing' 
                                            ? '💬 Message Sent' 
                                            : '📱 Message Received'
                                        }
                                      </span>
                                      <div className={`flex items-center gap-1 text-xs ${
                                        isDarkMode ? "text-text-secondary" : "text-gray-500"
                                      }`}>
                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <circle cx="12" cy="12" r="10"/>
                                          <polyline points="12,6 12,12 16,14"/>
                                        </svg>
                                        <span>
                                          {touchpoint.timestamp.toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                          })} at {touchpoint.timestamp.toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit',
                                            hour12: true 
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div
                                    className={`text-sm font-medium mb-2 ${
                                      isDarkMode ? "text-text-primary" : "text-gray-900"
                                    }`}
                                  >
                                    {touchpoint.type === 'email' ? touchpoint.content : touchpoint.content}
                                  </div>
                                  
                                  {touchpoint.type === 'email' && touchpoint.body && (
                                    <div
                                      className={`text-sm leading-relaxed ${
                                        isDarkMode ? "text-text-secondary" : "text-gray-600"
                                      }`}
                                    >
                                      {touchpoint.body.length > 120 
                                        ? `${touchpoint.body.substring(0, 120)}...` 
                                        : touchpoint.body
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Add New Touchpoint Button */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setMode("email")}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${
                              isDarkMode 
                                ? "bg-gradient-to-br from-gray-600 to-gray-700 group-hover:from-blue-600 group-hover:to-blue-700" 
                                : "bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-blue-500 group-hover:to-blue-600"
                            }`}>
                              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={`transition-colors duration-200 ${
                                isDarkMode 
                                  ? "text-gray-400 group-hover:text-white" 
                                  : "text-gray-600 group-hover:text-white"
                              }`}>
                                <path d="M12 5v14M5 12h14"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <button
                                className={`text-sm font-semibold transition-colors duration-200 ${
                                  isDarkMode 
                                    ? "text-text-primary group-hover:text-blue-400" 
                                    : "text-gray-700 group-hover:text-blue-600"
                                }`}
                              >
                                Add follow up...
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : mode === "message" ? (
            <>
              {/* iPhone Message Simulator */}
              <div className="w-full h-full bg-gray-50 flex flex-col rounded-lg shadow-lg overflow-hidden">
                {/* iMessage-style header */}
                <div
                  className="flex items-center justify-between px-3 py-2 bg-white border-b"
                  style={{ minHeight: 64 }}
                >
                  {/* Back arrow */}
                  <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-100 transition-colors">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L10 14L18 22"
                        stroke="#007aff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {/* Avatar and name */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mb-1">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="16" cy="12" r="6" fill="#b0b3b8" />
                        <path
                          d="M6 26c0-3.3137 5.3726-6 10-6s10 2.6863 10 6v2H6v-2z"
                          fill="#b0b3b8"
                        />
                      </svg>
                    </div>
                    <div className="text-sm font-medium text-black text-center whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis">
                      {businesses.find((b) => b.id === activeId)?.name || ""}
                    </div>
                  </div>
                  {/* Video icon */}
                  <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-blue-100 transition-colors">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="5"
                        y="8"
                        width="12"
                        height="12"
                        rx="3"
                        stroke="#007aff"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M21 11L25 9V19L21 17V11Z"
                        stroke="#007aff"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <MessageList className="flex-1 px-2">
                  {msgs.map((m) => (
                    <CSMessage
                      key={m.id}
                      model={{
                        message: m.text,
                        sentTime: new Date(m.timestamp).toLocaleTimeString(),
                        direction: m.direction,
                        position: "single",
                      }}
                      className={
                        m.direction === "outgoing" ? "ml-auto mr-2" : "mr-auto ml-2"
                      }
                    />
                  ))}
                </MessageList>
                {activeId && (
                  <div className="flex items-center p-3 bg-white border-t gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      className="flex-1 rounded-full px-4 py-2 text-base outline-none bg-gray-100 placeholder-gray-400 text-black"
                      placeholder="Message"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ transition: "color 0.2s" }}
                    />
                    <button
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                        input.trim() ? "bg-blue-500" : "bg-blue-300 cursor-default"
                      }`}
                      onClick={handleSend}
                      disabled={!input.trim()}
                      tabIndex={0}
                      aria-label="Send"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 15V5"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6 9L10 5L14 9"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : mode === "email" ? (
            <>
              {/* Email Interface */}
              <div
                className={`w-full h-full flex flex-col shadow-lg overflow-hidden ${
                  isDarkMode ? "bg-[#181B26]" : "bg-white"
                }`}
              >
                {isComposing ? (
                  <>
                    {/* Full-Screen Email Compose Form */}
                    <div
                      className={`w-full h-full flex flex-col ${
                        isDarkMode ? "bg-[#181B26]" : "bg-white"
                      }`}
                    >
                      {/* Email Header */}
                      <div
                        className={`flex items-center justify-between px-4 py-3 border-b ${
                          isDarkMode
                            ? "bg-[#181B26] border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <h3
                            className={`text-lg font-medium ${
                              isDarkMode ? "text-text-primary" : "text-gray-900"
                            }`}
                          >
                            New Message
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={closeComposeForm}
                            className={`p-1 ${
                              isDarkMode
                                ? "text-gray-500 hover:text-gray-700"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            <svg
                              width="20"
                              height="20"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Email Form - Full Screen */}
                      <div
                        className={`flex-1 flex flex-col ${
                          isDarkMode ? "bg-[#181B26]" : "bg-white"
                        }`}
                      >
                        {/* From Field */}
                        <div
                          className={`flex items-center px-4 py-3 border-b ${
                            isDarkMode ? "border-gray-600" : "border-gray-200"
                          }`}
                        >
                          <label
                            className={`w-16 text-sm font-medium ${
                              isDarkMode ? "text-text-secondary" : "text-gray-700"
                            }`}
                          >
                            From
                          </label>
                          <input
                            type="email"
                            value={emailForm.from}
                            onChange={(e) =>
                              setEmailForm((prev) => ({
                                ...prev,
                                from: e.target.value,
                              }))
                            }
                            className={`flex-1 text-sm border-none outline-none ${
                              isDarkMode
                                ? "text-text-primary bg-transparent"
                                : "text-gray-900 bg-transparent"
                            }`}
                          />
                          <div
                            className={`flex items-center gap-2 text-sm ${
                              isDarkMode ? "text-text-secondary" : "text-gray-500"
                            }`}
                          >
                            <button
                              className={`${
                                isDarkMode
                                  ? "hover:text-text-primary"
                                  : "hover:text-gray-700"
                              }`}
                            >
                              Cc
                            </button>
                            <button
                              className={`${
                                isDarkMode
                                  ? "hover:text-text-primary"
                                  : "hover:text-gray-700"
                              }`}
                            >
                              Bcc
                            </button>
                          </div>
                        </div>

                        {/* To Field */}
                        <div
                          className={`flex items-center px-4 py-3 border-b ${
                            isDarkMode ? "border-gray-600" : "border-gray-200"
                          }`}
                        >
                          <label
                            className={`w-16 text-sm font-medium ${
                              isDarkMode ? "text-text-secondary" : "text-gray-700"
                            }`}
                          >
                            To
                          </label>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="email"
                              value={emailForm.to}
                              onChange={(e) =>
                                setEmailForm((prev) => ({
                                  ...prev,
                                  to: e.target.value,
                                }))
                              }
                              onFocus={handleToFieldFocus}
                              className={`flex-1 text-sm border-none outline-none bg-transparent ${
                                isDarkMode ? "text-text-primary" : "text-gray-900"
                              }`}
                              placeholder="Enter email address (e.g., user@example.com)"
                            />
                            {isLoadingEmails === activeId && (
                              <div
                                className={`flex items-center gap-1 text-xs ${
                                  isDarkMode ? "text-text-secondary" : "text-gray-500"
                                }`}
                              >
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                <span>Finding emails...</span>
                              </div>
                            )}
                            {availableEmails.length > 0 && (
                              <div className="relative ml-2">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setEmailForm((prev) => ({
                                        ...prev,
                                        to: e.target.value,
                                      }));
                                    }
                                  }}
                                  className={`text-[10px] border rounded px-1 py-0.5 min-w-0 w-28 ${
                                    isDarkMode
                                      ? "bg-gray-700 border-gray-600 text-gray-300"
                                      : "bg-gray-100 border-gray-300 text-gray-700"
                                  }`}
                                  title="Select from found email addresses"
                                >
                                  <option value="">📧 Found emails</option>
                                  {availableEmails.map((item) =>
                                    item.emails.map((email, index) => {
                                      const business = businesses.find(
                                        (b) => b.id === item.businessId
                                      );
                                      return (
                                        <option
                                          key={`${item.businessId}-${index}`}
                                          value={email}
                                        >
                                          {email} ({business?.name})
                                        </option>
                                      );
                                    })
                                  )}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Subject Field */}
                        <div
                          className={`flex items-center px-4 py-3 border-b ${
                            isDarkMode ? "border-gray-600" : "border-gray-200"
                          }`}
                        >
                          <label
                            className={`w-16 text-sm font-medium ${
                              isDarkMode ? "text-text-secondary" : "text-gray-700"
                            }`}
                          >
                            Subject
                          </label>
                          <input
                            type="text"
                            value={emailForm.subject}
                            onChange={(e) =>
                              setEmailForm((prev) => ({
                                ...prev,
                                subject: e.target.value,
                              }))
                            }
                            className={`flex-1 text-sm border-none outline-none bg-transparent ${
                              isDarkMode ? "text-text-primary" : "text-gray-900"
                            }`}
                            placeholder="Subject"
                          />
                        </div>

                        {/* Email Body - Takes up remaining space */}
                        <div className="flex-1 p-4 flex flex-col">
                          <textarea
                            value={emailForm.body}
                            onChange={(e) =>
                              setEmailForm((prev) => ({
                                ...prev,
                                body: e.target.value,
                              }))
                            }
                            className={`w-full flex-1 text-sm border-none outline-none resize-none bg-transparent ${
                              isDarkMode ? "text-text-primary" : "text-gray-900"
                            }`}
                            placeholder="Compose your message..."
                          />
                        </div>

                        {/* Email Status Messages */}
                        {emailSendStatus.message && (
                          <div
                            className={`px-4 py-3 border-t ${
                              isDarkMode ? "border-gray-600" : "border-gray-200"
                            }`}
                          >
                            <div
                              className={`flex items-center gap-2 text-sm font-medium ${
                                emailSendStatus.type === "success"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {emailSendStatus.type === "success" ? (
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              ) : (
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                              )}
                              {emailSendStatus.message}
                            </div>
                          </div>
                        )}

                        {/* Email Actions */}
                        <div
                          className={`flex items-center justify-between px-4 py-3 border-t ${
                            isDarkMode
                              ? "border-gray-600 bg-[#101322]"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleSendRealEmail}
                              disabled={
                                !emailForm.to ||
                                !emailForm.subject ||
                                !emailForm.body ||
                                isSendingEmail
                              }
                              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                isSendingEmail
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : !emailForm.to ||
                                    !emailForm.subject ||
                                    !emailForm.body
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700"
                              } text-white`}
                              title="Send email via Resend"
                            >
                              {isSendingEmail ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                  </svg>
                                  Send Email
                                </>
                              )}
                            </button>
                            <button
                              className={`p-2 ${
                                isDarkMode
                                  ? "text-text-secondary hover:text-text-primary"
                                  : "text-gray-600 hover:text-gray-800"
                              }`}
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49" />
                              </svg>
                            </button>
                            <button
                              className={`p-2 ${
                                isDarkMode
                                  ? "text-text-secondary hover:text-text-primary"
                                  : "text-gray-600 hover:text-gray-800"
                              }`}
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </button>
                          </div>
                          <button
                            className={`p-2 ${
                              isDarkMode
                                ? "text-text-secondary hover:text-text-primary"
                                : "text-gray-600 hover:text-gray-800"
                            }`}
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <polyline points="6,9 6,2 18,2 18,9" />
                              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email Thread View */}
                    <div
                      className={`w-full h-full flex flex-col ${
                        isDarkMode ? "bg-[#181B26]" : "bg-gray-50"
                      }`}
                    >
                      {/* Thread Header */}
                      <div
                        className={`px-8 py-6 border-b ${
                          isDarkMode
                            ? "bg-[#181B26] border-gray-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Thread Icon */}
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isDarkMode ? "bg-blue-600" : "bg-blue-100"
                              }`}
                            >
                              <svg
                                width="20"
                                height="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                            </div>

                            {/* Thread Info */}
                            <div>
                              <h2
                                className={`text-xl font-semibold ${
                                  isDarkMode ? "text-text-primary" : "text-gray-900"
                                }`}
                              >
                                Email Conversation
                              </h2>
                              <div
                                className={`text-sm flex items-center space-x-3 ${
                                  isDarkMode ? "text-text-secondary" : "text-gray-600"
                                }`}
                              >
                                <span className="flex items-center space-x-1">
                                  <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  <span>
                                    {businesses.find((b) => b.id === activeId)?.name}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <svg
                                    width="14"
                                    height="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                                  </svg>
                                  <span>
                                    {(() => {
                                      const currentThread = emailThreads.find(
                                        (thread) => thread.businessId === activeId
                                      );
                                      return currentThread?.emails.length || 0;
                                    })()}{" "}
                                    message(s)
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={openComposeForm}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isDarkMode
                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                className="inline mr-2"
                              >
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                              </svg>
                              New Email
                            </button>
                            <button
                              onClick={closeEmailModal}
                              className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                  ? "hover:bg-gray-700 text-gray-400 hover:text-text-primary"
                                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              <svg
                                width="20"
                                height="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Email Thread */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {(() => {
                          const currentThread = emailThreads.find(
                            (thread) => thread.businessId === activeId
                          );
                          const currentBusiness = filteredBusinesses.find(
                            (b) => b.id === activeId
                          );

                          if (!currentThread || currentThread.emails.length === 0) {
                            return (
                              <div
                                className={`text-center py-24 max-w-md mx-auto ${
                                  isDarkMode ? "text-gray-500" : "text-gray-500"
                                }`}
                              >
                                <div
                                  className={`w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center ${
                                    isDarkMode ? "bg-gray-800" : "bg-gray-100"
                                  }`}
                                >
                                  <svg
                                    width="40"
                                    height="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    viewBox="0 0 24 24"
                                    className={isDarkMode ? "text-gray-600" : "text-gray-400"}
                                  >
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                  </svg>
                                </div>
                                <h3
                                  className={`text-2xl font-semibold mb-3 ${
                                    isDarkMode ? "text-text-primary" : "text-gray-900"
                                  }`}
                                >
                                  No Email Thread
                                </h3>
                                <p
                                  className={`text-base mb-8 leading-relaxed ${
                                    isDarkMode ? "text-text-secondary" : "text-gray-600"
                                  }`}
                                >
                                  Start your first conversation with{" "}
                                  <span className="font-medium">{currentBusiness?.name}</span>{" "}
                                  by sending them an email
                                </p>
                                <div className="space-y-3">
                                  <button
                                    onClick={openComposeForm}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      className="inline mr-3"
                                    >
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                      <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    Compose New Email
                                  </button>
                                  <button
                                    onClick={() => {
                                      /* TODO: Add template functionality */
                                    }}
                                    className={`w-full px-8 py-3 rounded-xl font-medium transition-colors border ${
                                      isDarkMode
                                        ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                                        : "border-gray-300 hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <svg
                                      width="18"
                                      height="18"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      className="inline mr-2"
                                    >
                                      <path d="M9 12h6M9 16h6M9 8h6M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    Use Email Template
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-8 max-w-5xl mx-auto px-6">
                              {currentThread.emails.map((email, index) => (
                                <div
                                  key={email.id}
                                  className={`rounded-xl shadow-lg border ${
                                    email.direction === "sent"
                                      ? isDarkMode
                                        ? "bg-[#1a1d2b] border-blue-500/30 ml-8"
                                        : "bg-blue-50 border-blue-200 ml-8"
                                      : isDarkMode
                                      ? "bg-[#1f1f2e] border-gray-600/30 mr-8"
                                      : "bg-white border-gray-200 mr-8"
                                  }`}
                                >
                                  {/* Email Header */}
                                  <div
                                    className={`px-8 py-6 border-b ${
                                      isDarkMode ? "border-gray-600/30" : "border-gray-100"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center space-x-4">
                                        {/* Avatar */}
                                        <div
                                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${
                                            email.direction === "sent" ? "bg-blue-500" : "bg-gray-500"
                                          }`}
                                        >
                                          {email.direction === "sent"
                                            ? "J"
                                            : email.from.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Sender Info */}
                                        <div>
                                          <div
                                            className={`font-semibold text-lg ${
                                              isDarkMode ? "text-text-primary" : "text-gray-900"
                                            }`}
                                          >
                                            {email.direction === "sent" ? "Jordan (You)" : email.from}
                                          </div>
                                          <div
                                            className={`text-sm flex items-center space-x-2 ${
                                              isDarkMode ? "text-text-secondary" : "text-gray-600"
                                            }`}
                                          >
                                            <span>to:</span>
                                            <span className="font-medium">{email.to}</span>
                                            {email.direction === "sent" && (
                                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                ✓ Sent
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Timestamp */}
                                      <div
                                        className={`text-sm ${
                                          isDarkMode ? "text-text-secondary" : "text-gray-500"
                                        }`}
                                      >
                                        <div className="text-right">
                                          <div className="font-medium">
                                            {email.timestamp.toLocaleDateString("en-US", {
                                              weekday: "short",
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })}
                                          </div>
                                          <div className="text-xs">
                                            {email.timestamp.toLocaleTimeString("en-US", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Subject */}
                                    <div
                                      className={`text-xl font-semibold ${
                                        isDarkMode ? "text-text-primary" : "text-gray-900"
                                      }`}
                                    >
                                      {email.subject}
                                    </div>
                                  </div>

                                  {/* Email Body */}
                                  <div className="px-8 py-8">
                                    <div
                                      className={`text-base whitespace-pre-wrap leading-7 ${
                                        isDarkMode ? "text-text-secondary" : "text-gray-700"
                                      }`}
                                      style={{
                                        fontFamily: "system-ui, -apple-system, sans-serif",
                                      }}
                                    >
                                      {email.body}
                                    </div>

                                    {/* Email Footer */}
                                    <div
                                      className={`mt-8 pt-6 border-t ${
                                        isDarkMode ? "border-gray-600/30" : "border-gray-100"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div
                                          className={`text-xs ${
                                            isDarkMode ? "text-text-secondary" : "text-gray-500"
                                          }`}
                                        >
                                          Message #{index + 1} in thread
                                        </div>
                                        <div className="flex space-x-3">
                                          {email.direction === "received" && (
                                            <button
                                              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                                                isDarkMode
                                                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                                              }`}
                                            >
                                              Reply
                                            </button>
                                          )}
                                          <button
                                            className={`text-xs px-3 py-1 rounded-md transition-colors ${
                                              isDarkMode
                                                ? "bg-gray-600 hover:bg-gray-700 text-white"
                                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                            }`}
                                          >
                                            Forward
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              {/* MailMerge Interface */}
              <div
                className={`w-full h-full flex flex-col shadow-lg overflow-hidden ${
                  isDarkMode ? "bg-[#181B26]" : "bg-white"
                }`}
              >
                {/* MailMerge Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 border-b ${
                    isDarkMode ? "bg-[#181B26] border-gray-600" : "bg-white border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <h3
                      className={`text-lg font-medium ${
                        isDarkMode ? "text-text-primary" : "text-gray-900"
                      }`}
                    >
                      MailMerge Campaign
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDarkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {filteredBusinesses.length} Recipients
                    </span>
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    onClick={() => {
                      /* TODO: Launch campaign */
                    }}
                  >
                    Send Campaign
                  </button>
                </div>

                {/* MailMerge Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {filteredBusinesses.length === 0 ? (
                    <div
                      className={`text-center py-24 max-w-md mx-auto ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center ${
                          isDarkMode ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      >
                        <svg
                          width="40"
                          height="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                          className={isDarkMode ? "text-gray-600" : "text-gray-400"}
                        >
                          <path d="M9 19V6l7 7-7 7z" />
                          <path d="M2 12h14" />
                        </svg>
                      </div>
                      <h3
                        className={`text-2xl font-semibold mb-3 ${
                          isDarkMode ? "text-text-primary" : "text-gray-900"
                        }`}
                      >
                        No Recipients Selected
                      </h3>
                      <p
                        className={`text-base mb-8 leading-relaxed ${
                          isDarkMode ? "text-text-secondary" : "text-gray-600"
                        }`}
                      >
                        Select businesses from the left sidebar to add them to your MailMerge
                        campaign.
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`rounded-lg border ${
                        isDarkMode ? "border-gray-600" : "border-gray-200"
                      }`}
                    >
                      {/* Table Header */}
                      <div
                        className={`grid grid-cols-4 gap-4 px-4 py-3 border-b font-medium text-sm ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-600 text-text-primary"
                            : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        <div>Business Name</div>
                        <div>Email</div>
                        <div>Contact Name</div>
                        <div>Rating</div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-gray-200">
                        {filteredBusinesses.map((business) => {
                          // Use actual email_1 from data, or fallback to generated email
                          let email;
                          if (business.email_1) {
                            email = business.email_1;
                          } else if (business.domain) {
                            const cleanDomain = business.domain
                              .replace(/^https?:\/\//, "")
                              .replace(/^www\./, "")
                              .replace(/\/$/, "");
                            email = `info@${cleanDomain}`;
                          } else {
                            email = `contact@${business.name
                              .toLowerCase()
                              .replace(/\s+/g, "")}.com`;
                          }

                          const contactName = business.name.split(" ")[0] + " Manager";

                          return (
                            <div
                              key={business.id}
                              className={`grid grid-cols-4 gap-4 px-4 py-3 text-sm cursor-pointer transition-colors ${
                                isDarkMode
                                  ? "hover:bg-gray-700 text-text-secondary"
                                  : "hover:bg-gray-50 text-gray-600"
                              }`}
                              onMouseEnter={() => setHoveredBusiness(business)}
                              onMouseLeave={() => setHoveredBusiness(null)}
                            >
                              <div
                                className={`font-medium ${
                                  isDarkMode ? "text-text-primary" : "text-gray-900"
                                }`}
                              >
                                {business.name}
                              </div>
                              <div className="text-blue-600 hover:text-blue-700 cursor-pointer">
                                {email}
                              </div>
                              <div>{contactName}</div>
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span>{business.rating}</span>
                                <span
                                  className={`text-xs ${
                                    isDarkMode ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  ({business.reviews})
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* Compose Email Form Preview for MailMerge */}
                <div className={`mt-8 w-full p-6 rounded-lg shadow border ${
                  isDarkMode ? 'bg-[#181B26] border-gray-600' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? 'text-text-primary' : 'text-gray-900'
                  }`}>MailMerge Email Preview</h3>
                  <form className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="w-16 text-sm font-medium">From</label>
                      <input
                        type="email"
                        className={`flex-1 rounded px-3 py-2 text-sm border ${
                          isDarkMode ? 'bg-[#101322] border-gray-600 text-text-primary' : 'bg-gray-100 border-gray-300 text-gray-900'
                        }`}
                        value={mailMergeForm.from}
                        disabled
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="w-16 text-sm font-medium">To</label>
                      <input
                        type="email"
                        className={`flex-1 rounded px-3 py-2 text-sm border ${
                          isDarkMode ? 'bg-[#101322] border-gray-600 text-text-primary' : 'bg-gray-100 border-gray-300 text-gray-900'
                        }`}
                        value={hoveredBusiness ? replacePlaceholders(mailMergeForm.to, hoveredBusiness) : mailMergeForm.to}
                        disabled
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="w-16 text-sm font-medium">Subject</label>
                      <input
                        type="text"
                        className={`flex-1 rounded px-3 py-2 text-sm border ${
                          isDarkMode ? 'bg-[#101322] border-gray-600 text-text-primary' : 'bg-gray-100 border-gray-300 text-gray-900'
                        }`}
                        value={hoveredBusiness ? replacePlaceholders(mailMergeForm.subject, hoveredBusiness) : mailMergeForm.subject}
                        readOnly
                      />
                    </div>
                                      <div>
                    <label className="block text-sm font-medium mb-1">Body</label>
                    <textarea
                      className={`w-full rounded px-3 py-2 text-sm border min-h-[120px] ${
                        isDarkMode ? 'bg-[#101322] border-gray-600 text-text-primary' : 'bg-gray-100 border-gray-300 text-gray-900'
                      }`}
                      value={hoveredBusiness ? replacePlaceholders(mailMergeForm.body, hoveredBusiness) : mailMergeForm.body}
                      onChange={(e) => setMailMergeForm(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Hi <<contact_name>>,

I noticed your business <<business_name>> has a rating of <<rating>> on Google. I wanted to reach out to discuss how we might be able to help improve your online presence.

Best regards,
Jordan"
                    />
                  </div>
                  </form>
                  <div className="mt-2 text-xs text-gray-500">
                    {hoveredBusiness ? `Previewing email for: ${hoveredBusiness.name}` : 'Hover over a business above to preview the personalized email.'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mode Toggle - Bottom Middle (aligned with Communication Center) */}
      <div className="fixed bottom-6 left-[280px] z-20">
        <div
          className={`flex rounded-lg p-1 border shadow-lg ${
            isDarkMode ? "bg-[#101322] border-gray-600" : "bg-white border-gray-300"
          }`}
        >

          <button
            onClick={() => setMode("message")}
            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
              mode === "message"
                ? isDarkMode
                  ? "bg-[#4FF5AC] text-[#0B0E18]"
                  : "bg-blue-600 text-white"
                : isDarkMode
                ? "text-text-secondary hover:text-text-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline mr-2"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Messages
          </button>
          <button
            onClick={() => {
              setMode("email");
              setIsComposing(true);
              updateEmailRecipients();
            }}
            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
              mode === "email"
                ? isDarkMode
                  ? "bg-[#4FF5AC] text-[#0B0E18]"
                  : "bg-blue-600 text-white"
                : isDarkMode
                ? "text-text-secondary hover:text-text-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline mr-2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email
          </button>
          <button
            onClick={() => setMode("mailmerge")}
            className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${
              mode === "mailmerge"
                ? isDarkMode
                  ? "bg-[#4FF5AC] text-[#0B0E18]"
                  : "bg-blue-600 text-white"
                : isDarkMode
                ? "text-text-secondary hover:text-text-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline mr-2"
            >
              <path d="M9 19V6l7 7-7 7z" />
              <path d="M2 12h14" />
            </svg>
            MailMerge
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <div
        className={`max-w-4xl mx-auto p-16 text-center ${
          isDarkMode ? "text-gray-600" : "text-gray-500"
        }`}
      >
        Star a business in the Directory first.
      </div>
      {/* Mode Toggle - Bottom Left (Disabled when no businesses) */}
      <div className="fixed bottom-6 left-6 z-20">
        <div
          className={`flex rounded-lg p-1 border shadow-lg opacity-50 ${
            isDarkMode ? "bg-[#101322] border-gray-600" : "bg-white border-gray-300"
          }`}
        >

          <button
            disabled
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isDarkMode ? "text-text-secondary" : "text-gray-600"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline mr-2"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Messages
          </button>
          <button
            disabled
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isDarkMode ? "text-text-secondary" : "text-gray-600"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline mr-2"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email
          </button>
          <button
            disabled
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isDarkMode ? "text-text-secondary" : "text-gray-600"
            }`}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline mr-2"
            >
              <path d="M9 19V6l7 7-7 7z" />
              <path d="M2 12h14" />
            </svg>
            MailMerge
          </button>
        </div>
      </div>
    </div>
  );
}
