# Run this script as Administrator

$siteName = "FileManagerAPI"
$port = 888
$phyPath = "e:\YashElectronics\FileManager\PHP-API"

Import-Module WebAdministration

if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "Site '$siteName' already exists. Removing..."
    Remove-WebSite -Name $siteName
}

Write-Host "Creating site '$siteName' on port $port mapping to '$phyPath'..."
New-WebSite -Name $siteName -Port $port -PhysicalPath $phyPath -Force

Write-Host "Site created successfully."
Write-Host "Please ensure PHP is enabled in IIS Handler Mappings."
Write-Host "You can test the API at http://localhost:$port/auth/login.php"
