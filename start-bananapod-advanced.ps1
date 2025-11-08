Param(
  [int]$PreferredPort = 3000,
  [int]$MaxWaitSeconds = 20
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms

function Show-Info($msg) {
  Write-Host "[INFO] $msg" -ForegroundColor Cyan
}
function Show-Warn($msg) {
  Write-Host "[WARN] $msg" -ForegroundColor Yellow
}
function Show-Error($msg) {
  Write-Host "[ERROR] $msg" -ForegroundColor Red
  [System.Windows.Forms.MessageBox]::Show($msg, 'BananaPod 启动错误', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}
function Show-Ok($msg) {
  [System.Windows.Forms.MessageBox]::Show($msg, 'BananaPod 启动成功', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information) | Out-Null
}

# 切到脚本所在目录
Set-Location -Path $PSScriptRoot
Show-Info "工作目录: $(Get-Location)"

# 依赖检查
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Show-Error "未检测到 Node.js。请安装 Node.js 18+（包含 npm）。"; exit 1 }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Show-Error "未检测到 npm。请安装 Node.js（包含 npm）。"; exit 1 }

# Node 版本提示
try {
  $nodeVer = (& node -v)
  if ($nodeVer) { Show-Warn "当前 Node 版本: $nodeVer（若插件提示 EBADENGINE，可升级到 >=22.12.0 或使用 20.19.0）" }
} catch {}

# 首次运行安装依赖
if (-not (Test-Path (Join-Path (Get-Location) 'node_modules'))) {
  Show-Info "首次运行：安装依赖（npm install）..."
  try { npm install } catch { Show-Error "依赖安装失败：$($_.Exception.Message)"; exit 1 }
}

# 环境文件提示
if (Test-Path ".env.local") { Show-Info ".env.local 已检测，将加载私钥与配置。" } else { Show-Warn "未找到 .env.local。若需外部 API，请创建并设置 WHATAI_API_KEY。" }

# 查找可用端口
function Get-FreePort([int]$start, [int]$limit) {
  foreach ($p in $start..($start+$limit)) {
    $busy = Test-NetConnection -ComputerName 'localhost' -Port $p -InformationLevel Quiet
    if (-not $busy) { return $p }
  }
  return $null
}

$portBusy = Test-NetConnection -ComputerName 'localhost' -Port $PreferredPort -InformationLevel Quiet
if ($portBusy) {
  Show-Warn "端口 $PreferredPort 已占用，尝试查找其他端口..."
  $freePort = Get-FreePort -start ($PreferredPort+1) -limit 50
  if (-not $freePort) { Show-Error "未找到可用端口，请释放被占用端口后重试。"; exit 1 }
  $usePort = $freePort
} else {
  $usePort = $PreferredPort
}

Show-Info "启动开发服务器：npm run dev -- --port $usePort"
try {
  # 单独窗口启动，方便查看日志
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev -- --port $usePort" -WorkingDirectory (Get-Location) -WindowStyle Normal | Out-Null
} catch {
  Show-Error "无法启动开发服务器：$($_.Exception.Message)"
  exit 1
}

# 等待服务器可访问
$ready = $false
for ($i = 0; $i -lt $MaxWaitSeconds; $i++) {
  try {
    $resp = Invoke-WebRequest -Uri "http://localhost:$usePort/" -UseBasicParsing -TimeoutSec 2
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { $ready = $true; break }
  } catch {}
  Start-Sleep -Seconds 1
}

if ($ready) {
  Start-Process "http://localhost:$usePort/" | Out-Null
  Show-Info "已打开浏览器： http://localhost:$usePort/"
  Show-Ok "开发服务器已启动并可访问：http://localhost:$usePort/"
  exit 0
} else {
  Show-Error "开发服务器未在 $MaxWaitSeconds 秒内就绪。请查看打开的服务器窗口日志。\n常见原因：\n- 端口被占用或网络安全拦截\n- 依赖安装失败或 Node 版本不兼容\n- 执行策略限制（请使用 Bypass 运行脚本）"
  exit 2
}