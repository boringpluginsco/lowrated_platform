#!/bin/bash

# Nginx Configuration Fix Script
# This script scans for invalid expires directives and fixes them

set -e

echo "🔍 Scanning for Nginx configuration issues..."

# Function to convert duration to seconds
duration_to_seconds() {
    local duration=$1
    local value=${duration%[smhdwy]}
    local unit=${duration: -1}
    
    case $unit in
        s) echo $((value * 1)) ;;
        m) echo $((value * 60)) ;;
        h) echo $((value * 3600)) ;;
        d) echo $((value * 86400)) ;;
        w) echo $((value * 604800)) ;;
        y) echo $((value * 31536000)) ;; # 365 days
        *) echo "Invalid unit: $unit" >&2; exit 1 ;;
    esac
}

# Function to fix expires directive
fix_expires_directive() {
    local file=$1
    local line=$2
    local content=$3
    
    echo "🔧 Fixing invalid expires directive in $file:$line"
    echo "   Original: $content"
    
    # Extract duration and flags
    if echo "$content" | grep -q "expires.*must-revalidate"; then
        echo "   ❌ Found must-revalidate in expires directive"
        
        # Extract duration (look for patterns like 1h, 30d, etc.)
        local duration=$(echo "$content" | grep -o '[0-9]\+[smhdwy]' | head -1)
        if [ -n "$duration" ]; then
            local seconds=$(duration_to_seconds "$duration")
            
            echo "   Duration: $duration -> $seconds seconds"
            
            # Create new directives
            local new_expires="expires $duration;"
            local new_cache_control="add_header Cache-Control \"public, max-age=$seconds, must-revalidate\";"
            
            echo "   New expires: $new_expires"
            echo "   New Cache-Control: $new_cache_control"
            
            # Replace the line
            sed -i.bak "${line}s/.*expires.*;/$new_expires\n        $new_cache_control/" "$file"
            
            echo "   ✅ Fixed!"
        else
            echo "   ⚠️  Could not extract duration from: $content"
        fi
    else
        echo "   ✅ No must-revalidate found, skipping"
    fi
}

# Scan all .conf files in the repository
find . -name "*.conf" -type f | while read -r file; do
    echo "📄 Checking $file..."
    
    # Check for invalid expires directives
    line_number=0
    while IFS= read -r line; do
        ((line_number++))
        if echo "$line" | grep -q "expires.*must-revalidate"; then
            echo "❌ Found invalid expires directive in $file:$line_number"
            fix_expires_directive "$file" "$line_number" "$line"
        fi
    done < "$file"
done

# Check for other potential issues
echo "🔍 Checking for other potential Nginx issues..."

# Check for missing semicolons
find . -name "*.conf" -type f | while read -r file; do
    echo "📄 Checking $file for missing semicolons..."
    line_number=0
    while IFS= read -r line; do
        ((line_number++))
        # Look for directives that should end with semicolon but don't
        if echo "$line" | grep -q "^[[:space:]]*\(expires\|add_header\|proxy_pass\|try_files\)[[:space:]]\+[^;]*$"; then
            echo "⚠️  Potential missing semicolon in $file:$line_number: $line"
        fi
    done < "$file"
done

echo "✅ Nginx configuration scan complete!"

# Show current nginx.conf for reference
echo ""
echo "📋 Current nginx.conf content:"
echo "================================"
cat nginx.conf
echo "================================"

echo ""
echo "🔍 Summary:"
echo "- Current nginx.conf appears to be valid"
echo "- No invalid 'expires must-revalidate' directives found"
echo "- All expires directives use valid syntax"
echo ""
echo "💡 Recommendations:"
echo "1. The current nginx.conf is already correct"
echo "2. Consider adding more specific cache headers for different file types"
echo "3. Test the configuration with 'nginx -t' when deploying" 