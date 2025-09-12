# PowerShell script to generate AWS services data from folder structure
# This script reads the AWS assets folder structure and creates a JSON file with all services

param(
    [string]$OutputPath = "scripts/aws-services-seed.json"
)

$rootPath = "public/aws/Architecture-Service"
$services = @()

# Category mapping to match our frontend configuration
$categoryMapping = @{
    "Arch_Analytics" = "Analytics"
    "Arch_App-Integration" = "Application-Integration"
    "Arch_Artificial-Intelligence" = "Artificial-Intelligence"
    "Arch_Blockchain" = "Blockchain"
    "Arch_Business-Applications" = "Business-Applications"
    "Arch_Cloud-Financial-Management" = "Cloud-Financial-Management"
    "Arch_Compute" = "Compute"
    "Arch_Containers" = "Containers"
    "Arch_Customer-Enablement" = "Customer-Enablement"
    "Arch_Database" = "Database"
    "Arch_Developer-Tools" = "Developer-Tools"
    "Arch_End-User-Computing" = "End-User-Computing"
    "Arch_Front-End-Web-Mobile" = "Front-End-Web-Mobile"
    "Arch_Games" = "Games"
    "Arch_General-Icons" = "General-Icons"
    "Arch_Internet-of-Things" = "Internet-of-Things"
    "Arch_Management-Governance" = "Management-Governance"
    "Arch_Media-Services" = "Media-Services"
    "Arch_Migration-Modernization" = "Migration-Modernization"
    "Arch_Networking-Content-Delivery" = "Networking-Content-Delivery"
    "Arch_Quantum-Technologies" = "Quantum-Technologies"
    "Arch_Satellite" = "Satellite"
    "Arch_Security-Identity-Compliance" = "Security-Identity-Compliance"
    "Arch_Storage" = "Storage"
}

# Function to convert service filename to display name
function Get-ServiceDisplayName {
    param([string]$fileName)
    
    $name = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    # Remove "Arch_" prefix
    $name = $name -replace "^Arch_", ""
    # Remove _64, _32 and similar suffixes
    $name = $name -replace "_64$", ""
    $name = $name -replace "_32$", ""
    # Replace hyphens and underscores with spaces
    $name = $name -replace "[-_]", " "
    return $name
}

# Function to create URL-friendly slug
function Get-ServiceSlug {
    param([string]$displayName)
    
    return $displayName.ToLower() -replace "\s+", "-" -replace "[^a-z0-9-]", ""
}

# Function to generate service description
function Get-ServiceDescription {
    param([string]$serviceName, [string]$category)
    
    # You can customize these descriptions based on actual AWS services
    $descriptions = @{
        "Amazon EC2" = "Secure and resizable compute capacity in the cloud. Launch applications when needed without upfront commitments."
        "AWS Lambda" = "Run code without thinking about servers. Pay only for the compute time consumed."
        "Amazon S3" = "Object storage built to retrieve any amount of data from anywhere on the web."
        "Amazon RDS" = "Managed relational database service for MySQL, PostgreSQL, Oracle, SQL Server, and MariaDB."
        "Amazon DynamoDB" = "Fast and flexible NoSQL database service for any scale."
        "Amazon CloudFront" = "Global content delivery network (CDN) service."
        "Amazon VPC" = "Isolated cloud resources in a virtual network that you define."
        "AWS IAM" = "Manage access to AWS services and resources securely."
    }
    
    if ($descriptions.ContainsKey($serviceName)) {
        return $descriptions[$serviceName]
    }
    
    return "AWS $serviceName service in the $category category. Learn more about this service and its capabilities."
}

Write-Host "Scanning AWS services in: $rootPath" -ForegroundColor Green

# Check if the root path exists
if (-not (Test-Path $rootPath)) {
    Write-Error "Root path not found: $rootPath"
    exit 1
}

# Get all category directories
$categoryDirs = Get-ChildItem -Path $rootPath -Directory | Where-Object { $_.Name.StartsWith("Arch_") }

Write-Host "Found $($categoryDirs.Count) categories" -ForegroundColor Yellow

foreach ($categoryDir in $categoryDirs) {
    $categoryName = $categoryMapping[$categoryDir.Name]
    
    if (-not $categoryName) {
        Write-Warning "No mapping found for category: $($categoryDir.Name), skipping..."
        continue
    }
    
    Write-Host "Processing category: $categoryName" -ForegroundColor Cyan
    
    # Get all SVG files in the category directory
    $svgFiles = Get-ChildItem -Path $categoryDir.FullName -Filter "*.svg"
    
    Write-Host "  Found $($svgFiles.Count) services" -ForegroundColor Gray
    
    foreach ($svgFile in $svgFiles) {
        $displayName = Get-ServiceDisplayName -fileName $svgFile.Name
        $slug = Get-ServiceSlug -displayName $displayName
        $serviceId = "$categoryName-$slug"
        $iconPath = "/aws/Architecture-Service/$($categoryDir.Name)/$($svgFile.Name)"
        
        $service = @{
            id = $serviceId
            name = $displayName
            slug = $slug
            category = $categoryName
            summary = "AWS $displayName service"
            description = Get-ServiceDescription -serviceName $displayName -category $categoryName
            htmlContent = "<h2>$displayName</h2><p>Detailed documentation for $displayName will be added here. This service is part of the $categoryName category.</p><h3>Key Features</h3><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul><h3>Use Cases</h3><p>Common use cases and scenarios for $displayName.</p>"
            iconPath = $iconPath
            enabled = $true
            createdAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
            updatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
        
        $services += $service
        Write-Host "    Added: $displayName" -ForegroundColor DarkGray
    }
}

Write-Host "Total services generated: $($services.Count)" -ForegroundColor Green

# Create the output directory if it doesn't exist
$outputDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Convert to JSON and save
$jsonOutput = $services | ConvertTo-Json -Depth 10
Set-Content -Path $OutputPath -Value $jsonOutput -Encoding UTF8

Write-Host "Services data saved to: $OutputPath" -ForegroundColor Green
Write-Host "You can now use this JSON file to seed your DynamoDB database." -ForegroundColor Yellow

# Display summary by category
Write-Host "`nSummary by Category:" -ForegroundColor Magenta
$services | Group-Object -Property category | Sort-Object Name | ForEach-Object {
    Write-Host "  $($_.Name): $($_.Count) services" -ForegroundColor White
}
