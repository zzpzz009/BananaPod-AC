@echo off
REM 以绕过执行策略的方式调用增强版 PowerShell 启动脚本
setlocal

set SCRIPT=%~dp0start-bananapod-advanced.ps1
if not exist "%SCRIPT%" (
  echo [ERROR] 未找到增强脚本：%SCRIPT%
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
if errorlevel 1 (
  echo.
  echo [ERROR] PowerShell 执行失败或被策略阻止。
  echo 请在终端手动运行：powershell -ExecutionPolicy Bypass -File .\start-bananapod-advanced.ps1
  pause
)

endlocal
exit /b 0