yarn.cmd install
yarn.cmd build

$currentLocation = Get-Location
$action = New-ScheduledTaskAction `
 -Execute "$currentLocation\run.bat" `
 -Argument $currentLocation
$trigger = New-ScheduledTaskTrigger `
 -Once -At 07:00:12 `
 -RepetitionInterval (New-TimeSpan -Hours 1) `
 -RepetitionDuration (New-TimeSpan -Hours 9)

$settings = New-ScheduledTaskSettingsSet `
 -AllowStartIfOnBatteries `
 -DontStopIfGoingOnBatteries `
 -StartWhenAvailable `
 -RunOnlyIfNetworkAvailable `
 -RestartCount 1 `
 -RestartInterval 00:15:00

Register-ScheduledTask `
 -Action $action `
 -Trigger $trigger `
 -Settings $settings `
 -TaskName "wwwupdater" `
 -TaskPath "node" `
 -Description "Windows Weather Wallpaper"