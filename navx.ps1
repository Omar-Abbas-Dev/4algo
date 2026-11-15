#Requires -Version 5.1
<#
.SYNOPSIS
    NavX Arena - Project Management Console
.DESCRIPTION
    Interactive TUI to build, clean, test, and run the NavX Arena project.
    Covers: .NET 10 backend, React/Vite frontend, Python algorithm engine.
    Usage:  powershell -ExecutionPolicy Bypass -File navx.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

# ==============================================================
#  PATHS
# ==============================================================
$Root     = $PSScriptRoot
$Solution = Join-Path $Root "NavX.slnx"
$Backend  = Join-Path $Root "src\backend\NavX.Api\NavX.Api.csproj"
$Frontend = Join-Path $Root "src\frontend"
$PySrc    = Join-Path $Root "src\backend\NavX.AlgorithmEngine"

# Detect Python executable from appsettings.Development.json
$PyExe = "python"
$devSettings = Join-Path $Root "src\backend\NavX.Api\appsettings.Development.json"
if (Test-Path $devSettings) {
    try {
        $j = Get-Content $devSettings -Raw | ConvertFrom-Json
        if ($j.PythonEngine.Executable) { $PyExe = $j.PythonEngine.Executable }
    } catch {}
}

# ==============================================================
#  ANSI COLORS
# ==============================================================
$R  = "`e[0m"      # Reset
$B  = "`e[1m"      # Bold
$Dm = "`e[2m"      # Dim
$Rd = "`e[91m"     # Red
$Gr = "`e[92m"     # Green
$Yw = "`e[93m"     # Yellow
$Bl = "`e[94m"     # Blue
$Mg = "`e[95m"     # Magenta
$Cy = "`e[96m"     # Cyan
$Wh = "`e[97m"     # White
$BgD  = "`e[48;5;234m"   # Dark bg
$BgP  = "`e[48;5;236m"   # Panel bg
$BgGr = "`e[48;5;22m"    # Green bg
$BgRd = "`e[48;5;52m"    # Red bg

# ==============================================================
#  HELPERS
# ==============================================================
function Write-Banner {
    $w = [Math]::Max($Host.UI.RawUI.WindowSize.Width, 82)
    Clear-Host
    Write-Host ""

    $logo = @(
        "  ███╗   ██╗ █████╗ ██╗   ██╗██╗  ██╗    █████╗ ██████╗ ███████╗███╗   ██╗ █████╗ ",
        "  ████╗  ██║██╔══██╗██║   ██║╚██╗██╔╝   ██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗",
        "  ██╔██╗ ██║███████║██║   ██║ ╚███╔╝    ███████║██████╔╝█████╗  ██╔██╗ ██║███████║",
        "  ██║╚██╗██║██╔══██║╚██╗ ██╔╝ ██╔██╗   ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║██╔══██║",
        "  ██║ ╚████║██║  ██║ ╚████╔╝ ██╔╝ ██╗  ██║  ██║██║  ██║███████╗██║ ╚████║██║  ██║",
        "  ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══╝ ╚═╝  ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝"
    )
    $logoColors = @($Cy,$Cy,$Bl,$Bl,$Mg,$Mg)
    for ($li = 0; $li -lt $logo.Length; $li++) {
        $line = $logo[$li]
        $pad  = [Math]::Max(0, [Math]::Floor(($w - $line.Length) / 2))
        Write-Host ($B + $logoColors[$li] + (" " * $pad) + $line + $R)
    }

    $sub = "BFS  *  DFS  *  Greedy  *  A-Star  --  Visual Algorithm Race"
    $pad = [Math]::Max(0, [Math]::Floor(($w - $sub.Length) / 2))
    Write-Host ""
    Write-Host ($Dm + $Wh + (" " * $pad) + $sub + $R)

    # Runtime status bar
    $dnv  = try { (& dotnet --version 2>$null).Trim() } catch { "n/a" }
    $ndv  = try { (& node   --version 2>$null).Trim() } catch { "n/a" }
    $pyv  = try { (& "$PyExe" --version 2>$null).Trim() } catch { "n/a" }
    $bar  = "  .NET $dnv   Node $ndv   $pyv  "
    $pad2 = [Math]::Max(0, [Math]::Floor(($w - $bar.Length) / 2))
    Write-Host ($Dm + (" " * $pad2) + $bar + $R)

    Write-Div
    Write-Host ""
}

function Write-Div {
    $w    = [Math]::Max($Host.UI.RawUI.WindowSize.Width, 82)
    $line = "-" * ($w - 4)
    Write-Host ("  " + $Dm + $line + $R)
}

function Write-Section([string]$title, [string]$col = "") {
    if (-not $col) { $col = $Cy }
    Write-Host ""
    Write-Host ("  " + $BgP + $col + $B + "  $title  " + $R)
    Write-Host ""
}

# Run an external command with animated spinner; returns hashtable {Ok, Output, Error}
function Invoke-Cmd {
    param(
        [string]   $Label,
        [string]   $Exe,
        [string[]] $Arguments,
        [string]   $WorkDir = $Root
    )

    $frames = @('|','/','-','\')
    $i = 0

    Write-Host ("  " + $Cy + $frames[0] + $R + "  " + $Label) -NoNewline

    $psi                        = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName               = $Exe
    $psi.Arguments              = ($Arguments -join " ")
    $psi.WorkingDirectory       = $WorkDir
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.UseShellExecute        = $false
    $psi.CreateNoWindow         = $true

    $proc    = [System.Diagnostics.Process]::Start($psi)
    $outTask = $proc.StandardOutput.ReadToEndAsync()
    $errTask = $proc.StandardError.ReadToEndAsync()

    while (-not $proc.HasExited) {
        $f = $frames[$i % $frames.Length]
        Write-Host ("`r  " + $Cy + $f + $R + "  " + $Label + "  ") -NoNewline
        Start-Sleep -Milliseconds 100
        $i++
    }
    $proc.WaitForExit()

    $stdout = $outTask.GetAwaiter().GetResult()
    $stderr = $errTask.GetAwaiter().GetResult()
    $code   = $proc.ExitCode

    if ($code -eq 0) {
        Write-Host ("`r  " + $Gr + $B + "v" + $R + "  " + $Label + "  ")
        return @{ Ok=$true; Output=$stdout; Err=$stderr }
    } else {
        Write-Host ("`r  " + $Rd + $B + "X" + $R + "  " + $Label + "  " + $Dm + "(exit $code)" + $R)
        $errLines = ($stderr + $stdout) -split "`n" | Where-Object { $_.Trim() } | Select-Object -Last 15
        if ($errLines) {
            Write-Host ""
            $errLines | ForEach-Object { Write-Host ("      " + $Rd + $Dm + $_ + $R) }
        }
        return @{ Ok=$false; Output=$stdout; Err=$stderr }
    }
}

function Write-Summary([System.Collections.Specialized.OrderedDictionary]$results) {
    Write-Host ""
    Write-Div
    $pass = 0; $fail = 0
    foreach ($k in $results.Keys) {
        $ok = $results[$k]
        if ($ok) { $pass++ } else { $fail++ }
        $icon  = if ($ok) { $Gr + "v" + $R } else { $Rd + "X" + $R }
        $badge = if ($ok) { $BgGr + $Wh + " PASS " + $R } else { $BgRd + $Wh + " FAIL " + $R }
        Write-Host ("    $icon  " + $k.PadRight(38) + "  $badge")
    }
    Write-Div
    Write-Host ""
    if ($fail -eq 0) {
        Write-Host ("  " + $Gr + $B + ">> All $pass targets succeeded." + $R)
    } else {
        Write-Host ("  " + $Rd + $B + "XX $fail target(s) failed -- see output above." + $R)
    }
}

function Pause-Menu {
    Write-Host ""
    Write-Host ("  " + $Dm + "Press any key to return to menu..." + $R)
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Confirm-Action([string]$question) {
    Write-Host ("  " + $Yw + $B + "! $question" + $R)
    Write-Host ("  " + $Yw + "[Y] Yes   [N] No  -> " + $R) -NoNewline
    $k = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ([char]$k.Character)
    return ([char]$k.Character) -match '^[Yy]$'
}

# ==============================================================
#  MENU RENDERER
# ==============================================================
function Write-Menu {
    param(
        [int]      $Selected,
        [string[]] $Items,
        [string[]] $Descs,
        [string[]] $Icons,
        [string[]] $Colors
    )

    Write-Host ("  " + $Dm + "Choose an action  ( UP/DOWN arrows  *  Enter  *  1-0  *  Q to quit )" + $R)
    Write-Host ""

    for ($j = 0; $j -lt $Items.Length; $j++) {
        $col  = $Colors[$j]
        $num  = "[" + (($j + 1) % 10) + "]"   # 1-9, then 0
        $icon = $Icons[$j]
        $lbl  = $Items[$j]
        $desc = $Descs[$j]

        if ($j -eq $Selected) {
            $pad  = [Math]::Max(0, 54 - $lbl.Length - $desc.Length)
            Write-Host ("  " + $BgP + $col + $B + " > $num $icon  $lbl" + $R + $BgP + $Dm + "  $desc" + (" " * $pad) + $R)
        } else {
            Write-Host ("    " + $Dm + $num + $R + " " + $col + $icon + $R + "  " + $lbl + "  " + $Dm + $desc + $R)
        }
    }

    Write-Host ""
}

# ==============================================================
#  ACTION: BUILD ALL
# ==============================================================
function Build-All {
    Write-Banner
    Write-Section "BUILD ALL  --  .NET + React/Vite + Python"

    $res = [ordered]@{}

    $r = Invoke-Cmd ".NET  Restore packages" "dotnet" @("restore", "`"$Solution`"", "--nologo", "-q") $Root
    $res['.NET Restore'] = $r.Ok

    $r = Invoke-Cmd ".NET  Build solution (all projects)" "dotnet" @("build", "`"$Solution`"", "--nologo", "-q", "--no-restore") $Root
    $res['.NET Build'] = $r.Ok

    $r = Invoke-Cmd "NPM   Install frontend dependencies" "npm" @("install", "--silent") $Frontend
    $res['Frontend npm install'] = $r.Ok

    $r = Invoke-Cmd "Vite  Build React / TypeScript" "npm" @("run", "build") $Frontend
    $res['Frontend Vite build'] = $r.Ok

    $pyFiles = Get-ChildItem $PySrc -Recurse -Filter "*.py" -ErrorAction SilentlyContinue |
               Select-Object -ExpandProperty FullName
    if ($pyFiles) {
        $r = Invoke-Cmd "Py    Syntax-check algorithm engine" "$PyExe" (@("-m","py_compile") + $pyFiles) $PySrc
        $res['Python syntax'] = $r.Ok
    } else {
        Write-Host ("  " + $Yw + "o" + $R + "  Py    No .py files found -- skipped")
        $res['Python syntax'] = $true
    }

    Write-Summary $res
    Pause-Menu
}

# ==============================================================
#  ACTION: BUILD BACKEND
# ==============================================================
function Build-Backend {
    Write-Banner
    Write-Section "BUILD BACKEND  --  .NET 10 / Clean Architecture" $Bl

    $res = [ordered]@{}

    $r = Invoke-Cmd ".NET  Restore packages" "dotnet" @("restore", "`"$Solution`"", "--nologo", "-q") $Root
    $res['.NET Restore'] = $r.Ok

    $r = Invoke-Cmd ".NET  Build solution" "dotnet" @("build", "`"$Solution`"", "--nologo") $Root
    $res['.NET Build'] = $r.Ok

    Write-Summary $res
    Pause-Menu
}

# ==============================================================
#  ACTION: BUILD FRONTEND
# ==============================================================
function Build-Frontend {
    Write-Banner
    Write-Section "BUILD FRONTEND  --  React 18 / Vite / Tailwind v4" $Mg

    $res = [ordered]@{}

    $r = Invoke-Cmd "NPM   Install dependencies" "npm" @("install", "--silent") $Frontend
    $res['npm install'] = $r.Ok

    $r = Invoke-Cmd "Vite  Build React / TypeScript" "npm" @("run", "build") $Frontend
    $res['vite build'] = $r.Ok

    # Show bundle size
    $distJs = Join-Path $Frontend "dist\assets"
    if ($res['vite build'] -and (Test-Path $distJs)) {
        $kb = (Get-ChildItem $distJs -Filter "*.js" | Measure-Object -Property Length -Sum).Sum / 1KB
        Write-Host ("      " + $Dm + "JS bundle: " + [Math]::Round($kb, 1) + " kB" + $R)
    }

    Write-Summary $res
    Pause-Menu
}

# ==============================================================
#  ACTION: BUILD PYTHON
# ==============================================================
function Build-Python {
    Write-Banner
    Write-Section "BUILD PYTHON  --  Algorithm engine syntax check" $Yw

    $pyFiles = Get-ChildItem $PySrc -Recurse -Filter "*.py" -ErrorAction SilentlyContinue

    if (-not $pyFiles) {
        Write-Host ("  " + $Yw + "o  No .py files found in $PySrc" + $R)
        Pause-Menu
        return
    }

    Write-Host ("  " + $Dm + "Python : $PyExe" + $R)
    Write-Host ("  " + $Dm + "Files  : " + @($pyFiles).Count + " .py files" + $R)
    Write-Host ""

    $res = [ordered]@{}
    foreach ($f in $pyFiles) {
        $rel = $f.FullName.Replace($PySrc + "\", "")
        $r   = Invoke-Cmd "Py  $rel" "$PyExe" @("-m", "py_compile", "`"$($f.FullName)`"") $PySrc
        $res[$rel] = $r.Ok
    }

    Write-Summary $res
    Pause-Menu
}

# ==============================================================
#  ACTION: RUN TESTS
# ==============================================================
function Run-Tests {
    Write-Banner
    Write-Section "RUN TESTS  --  30 tests * 4 suites * Real Python Engine" $Gr

    Write-Host ("  " + $Dm + "Suite breakdown:" + $R)
    Write-Host ("    " + $Cy + "*" + $R + " Domain Tests         (12) -- WinnerPolicy, AlgorithmType, Grid")
    Write-Host ("    " + $Mg + "*" + $R + " Application Tests     (6) -- RunRace command handler")
    Write-Host ("    " + $Yw + "*" + $R + " Architecture Tests    (4) -- Clean Architecture via NetArchTest")
    Write-Host ("    " + $Gr + "*" + $R + " Integration Tests     (8) -- Real HTTP + Real Python engine")
    Write-Host ""

    $frames = @('|','/','-','\')
    $i = 0

    Write-Host ("  " + $Cy + $frames[0] + $R + "  Running dotnet test...") -NoNewline

    $psi                        = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName               = "dotnet"
    $psi.Arguments              = "test `"$Solution`" --nologo"
    $psi.WorkingDirectory       = $Root
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.UseShellExecute        = $false
    $psi.CreateNoWindow         = $true

    $proc    = [System.Diagnostics.Process]::Start($psi)
    $outTask = $proc.StandardOutput.ReadToEndAsync()
    $errTask = $proc.StandardError.ReadToEndAsync()

    while (-not $proc.HasExited) {
        $f = $frames[$i % $frames.Length]
        Write-Host ("`r  " + $Cy + $f + $R + "  Running dotnet test...") -NoNewline
        Start-Sleep -Milliseconds 100
        $i++
    }
    $proc.WaitForExit()

    $stdout = $outTask.GetAwaiter().GetResult()
    $stderr = $errTask.GetAwaiter().GetResult()
    $code   = $proc.ExitCode

    Write-Host ""
    Write-Div
    Write-Host ""

    # Pretty-print output with coloured highlights
    ($stdout + $stderr) -split "`n" | Where-Object { $_.Trim() } | ForEach-Object {
        $line = $_.TrimEnd()
        if     ($line -match "passed")  { Write-Host ("  " + $Gr + $line + $R) }
        elseif ($line -match "failed")  { Write-Host ("  " + $Rd + $line + $R) }
        elseif ($line -match "Error")   { Write-Host ("  " + $Rd + $Dm + $line + $R) }
        elseif ($line -match "Warning") { Write-Host ("  " + $Yw + $Dm + $line + $R) }
        else                            { Write-Host ("  " + $Dm + $line + $R) }
    }

    Write-Host ""
    Write-Div
    Write-Host ""

    if ($code -eq 0) {
        Write-Host ("  " + $Gr + $B + ">> All tests passed!" + $R)
    } else {
        Write-Host ("  " + $Rd + $B + "XX Some tests failed (exit $code)" + $R)
    }

    Pause-Menu
}

# ==============================================================
#  ACTION: CLEAN ALL
# ==============================================================
function Clean-All {
    Write-Banner
    Write-Section "CLEAN ALL  --  bin/ obj/ dist/ __pycache__" $Rd

    Write-Host ("  " + $Yw + $B + "! The following will be deleted:" + $R)
    Write-Host ""
    Write-Host ("      " + $Dm + "* src\backend\**\bin\  obj\" + $R)
    Write-Host ("      " + $Dm + "* tests\**\bin\  obj\" + $R)
    Write-Host ("      " + $Dm + "* src\frontend\dist\" + $R)
    Write-Host ("      " + $Dm + "* src\backend\NavX.AlgorithmEngine\**\__pycache__  *.pyc" + $R)
    Write-Host ""

    if (-not (Confirm-Action "Proceed with clean?")) {
        Write-Host ("  " + $Dm + "Cancelled." + $R)
        Pause-Menu
        return
    }

    Write-Host ""
    $res = [ordered]@{}

    # .NET clean
    $r = Invoke-Cmd ".NET  dotnet clean solution" "dotnet" @("clean", "`"$Solution`"", "--nologo", "-q") $Root
    $res['.NET clean'] = $r.Ok

    # Frontend dist
    Write-Host ("  " + $Cy + "|" + $R + "  Vite  Removing dist/") -NoNewline
    $dist = Join-Path $Frontend "dist"
    if (Test-Path $dist) {
        Remove-Item $dist -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host ("`r  " + $Gr + "v" + $R + "  Vite  Removing dist/")
    } else {
        Write-Host ("`r  " + $Yw + "o" + $R + "  Vite  dist/ already clean")
    }
    $res['Frontend dist'] = $true

    # Python cache
    Write-Host ("  " + $Cy + "|" + $R + "  Py    Removing __pycache__ / *.pyc") -NoNewline
    Get-ChildItem $PySrc -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue |
        Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Get-ChildItem $PySrc -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host ("`r  " + $Gr + "v" + $R + "  Py    Removing __pycache__ / *.pyc")
    $res['Python cache'] = $true

    # Optional: node_modules
    Write-Host ""
    if (Confirm-Action "Also remove node_modules? (npm install needed after)") {
        Write-Host ("  " + $Cy + "|" + $R + "  NPM   Removing node_modules/") -NoNewline
        $nm = Join-Path $Frontend "node_modules"
        if (Test-Path $nm) {
            Remove-Item $nm -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host ("`r  " + $Gr + "v" + $R + "  NPM   Removing node_modules/")
        } else {
            Write-Host ("`r  " + $Yw + "o" + $R + "  NPM   node_modules/ not found")
        }
        $res['node_modules'] = $true
    }

    Write-Summary $res
    Pause-Menu
}

# ==============================================================
#  ACTION: RUN APP
# ==============================================================
function Run-App {
    Write-Banner
    Write-Section "RUN APP  --  NavX Arena Dev Server" $Cy

    Write-Host ("  " + $Cy + "URL:   " + $R + $B + "http://localhost:5000" + $R)
    Write-Host ("  " + $Dm + "API:   http://localhost:5000/api" + $R)
    Write-Host ("  " + $Dm + "Docs:  http://localhost:5000/scalar" + $R)
    Write-Host ("  " + $Dm + "Py:    $PyExe" + $R)
    Write-Host ""
    Write-Host ("  " + $Yw + "Press Ctrl+C to stop the server." + $R)
    Write-Div
    Write-Host ""

    Set-Location $Root
    & dotnet run --project "$Backend"
}

# ==============================================================
#  ACTION: RUN DOCKER
# ==============================================================
function Run-Docker {
    Write-Banner
    Write-Section "DOCKER  --  Production Build + Deploy" $Bl

    Write-Host ("  " + $Dm + "Command: docker compose up --build" + $R)
    Write-Host ("  " + $Dm + "Builds all images and starts all containers." + $R)
    Write-Host ""

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host ("  " + $Rd + "X  Docker not found in PATH. Install Docker Desktop first." + $R)
        Pause-Menu
        return
    }

    $r = Invoke-Cmd "Docker  Build + start containers" "docker" @("compose","up","--build") $Root
    if ($r.Ok) {
        Write-Host ("  " + $Gr + ">> Containers running." + $R)
    }
    Pause-Menu
}

# ==============================================================
#  ACTION: PROJECT INFO
# ==============================================================
function Show-Info {
    Write-Banner
    Write-Section "PROJECT INFO  --  NavX Arena"

    # Runtimes
    $dnv = try { (& dotnet --version 2>$null).Trim() } catch { "not found" }
    $ndv = try { (& node   --version 2>$null).Trim() } catch { "not found" }
    $pyv = try { (& "$PyExe" --version 2>$null).Trim() } catch { "not found" }

    Write-Host ("  " + $Cy + $B + "-- Runtimes ----------------------------------------" + $R)
    Write-Host ("      .NET    " + $Bl + $dnv + $R)
    Write-Host ("      Node    " + $Gr + $ndv + $R)
    Write-Host ("      Python  " + $Yw + $pyv + $R + "  " + $Dm + "via $PyExe" + $R)
    Write-Host ""

    Write-Host ("  " + $Cy + $B + "-- Paths -------------------------------------------" + $R)
    @(
        @("Root",     $Root),
        @("Solution", "NavX.slnx"),
        @("Backend",  "src\backend\NavX.Api\"),
        @("Frontend", "src\frontend\"),
        @("Python",   "src\backend\NavX.AlgorithmEngine\"),
        @("Tests",    "tests\"),
        @("DB",       "data\navx.db  (SQLite -- EF Migrations)")
    ) | ForEach-Object { Write-Host ("      " + $_[0].PadRight(10) + $Dm + $_[1] + $R) }
    Write-Host ""

    Write-Host ("  " + $Cy + $B + "-- Endpoints ---------------------------------------" + $R)
    Write-Host ("      App     " + $Wh + "http://localhost:5000" + $R)
    Write-Host ("      API     " + $Wh + "http://localhost:5000/api" + $R)
    Write-Host ("      Docs    " + $Wh + "http://localhost:5000/scalar" + $R)
    Write-Host ("      Docker  " + $Dm + "docker compose up --build" + $R)
    Write-Host ""

    Write-Host ("  " + $Cy + $B + "-- Score Formula -----------------------------------" + $R)
    Write-Host ("      " + $Yw + "Score = 0.6 x (cost - min) / (max - min)" + $R)
    Write-Host ("      " + $Yw + "      + 0.4 x (time - min) / (max - min)" + $R)
    Write-Host ("      " + $Dm + "Lower = better  *  Implemented in C# and TypeScript" + $R)
    Write-Host ""

    Write-Host ("  " + $Cy + $B + "-- Algorithms --------------------------------------" + $R)
    Write-Host ("      " + $Gr + "BFS" + $R    + "     Breadth-First Search  -- shortest hop count")
    Write-Host ("      " + $Rd + "DFS" + $R    + "     Depth-First Search    -- explores deep paths")
    Write-Host ("      " + $Yw + "Greedy" + $R + "  Greedy Best-First      -- heuristic only, fast but suboptimal")
    Write-Host ("      " + $Cy + "A*" + $R     + "      A-Star               -- optimal cost (g + h)")
    Write-Host ""

    Write-Host ("  " + $Cy + $B + "-- Architecture ------------------------------------" + $R)
    Write-Host ("      " + $Dm + "Domain -> Application -> Infrastructure -> Presentation" + $R)
    Write-Host ("      " + $Dm + "Enforced by NetArchTest (4 architecture tests)" + $R)
    Write-Host ""

    # Codebase stats
    $cs = (Get-ChildItem (Join-Path $Root "src\backend") -Recurse -Filter "*.cs"  -ErrorAction SilentlyContinue).Count
    $ts = (Get-ChildItem (Join-Path $Root "src\frontend\src") -Recurse -Include "*.tsx","*.ts" -ErrorAction SilentlyContinue).Count
    $py = (Get-ChildItem $PySrc -Recurse -Filter "*.py" -ErrorAction SilentlyContinue).Count

    Write-Host ("  " + $Cy + $B + "-- Codebase ----------------------------------------" + $R)
    Write-Host ("      " + $Bl + "$("$cs".PadLeft(4)) .cs files" + $R    + "   .NET Clean Architecture")
    Write-Host ("      " + $Mg + "$("$ts".PadLeft(4)) .ts/tsx files" + $R + "  React / Vite / Tailwind v4")
    Write-Host ("      " + $Yw + "$("$py".PadLeft(4)) .py files" + $R    + "   Python algorithm engine")
    Write-Host ""

    Pause-Menu
}

# ==============================================================
#  MENU DEFINITION  (10 items; key 0 = item 10 = Exit)
# ==============================================================
$MenuItems = @(
    "Build All"
    "Build Backend   (.NET)"
    "Build Frontend  (React / Vite)"
    "Build Python    (syntax check)"
    "Run Tests       (30 tests - real engine)"
    "Clean All"
    "Run App         (dev server)"
    "Run Docker      (production)"
    "Project Info"
    "Exit"
)

$MenuDescs = @(
    ".NET + React/Vite + Python"
    "dotnet build NavX.slnx"
    "npm install + vite build"
    "py_compile each .py file"
    "dotnet test -- 4 suites"
    "bin/ obj/ dist/ __pycache__"
    "dotnet run -> localhost:5000"
    "docker compose up --build"
    "paths * formula * algo * stats"
    "quit this console"
)

$MenuIcons = @("*","B","F","P","T","C","R","D","I","Q")

$MenuColors = @($Wh,$Bl,$Mg,$Yw,$Gr,$Rd,$Cy,$Bl,$Dm,$Dm)

# ==============================================================
#  MAIN LOOP
# ==============================================================
$selected = 0

while ($true) {
    Write-Banner
    Write-Menu -Selected $selected -Items $MenuItems -Descs $MenuDescs -Icons $MenuIcons -Colors $MenuColors

    $key  = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    $vk   = $key.VirtualKeyCode
    $char = [char]$key.Character

    switch ($vk) {
        38 { $selected = ($selected - 1 + $MenuItems.Length) % $MenuItems.Length }   # Up arrow
        40 { $selected = ($selected + 1) % $MenuItems.Length }                        # Down arrow
        13 {   # Enter
            switch ($selected) {
                0 { Build-All     }
                1 { Build-Backend }
                2 { Build-Frontend}
                3 { Build-Python  }
                4 { Run-Tests     }
                5 { Clean-All     }
                6 { Run-App       }
                7 { Run-Docker    }
                8 { Show-Info     }
                9 { Clear-Host; Write-Host ""; Write-Host "  Goodbye!"; Write-Host ""; exit 0 }
            }
        }
        default {
            # Number keys: 1-9 and 0
            if ($char -match '^[1-9]$') {
                $idx = [int]::Parse($char) - 1
                $selected = $idx
                switch ($selected) {
                    0 { Build-All     }
                    1 { Build-Backend }
                    2 { Build-Frontend}
                    3 { Build-Python  }
                    4 { Run-Tests     }
                    5 { Clean-All     }
                    6 { Run-App       }
                    7 { Run-Docker    }
                    8 { Show-Info     }
                }
            }
            if ($char -eq '0') {
                Clear-Host; Write-Host ""; Write-Host "  Goodbye!"; Write-Host ""; exit 0
            }
            if ($char -match '^[Qq]$') {
                Clear-Host; Write-Host ""; Write-Host "  Goodbye!"; Write-Host ""; exit 0
            }
        }
    }
}
