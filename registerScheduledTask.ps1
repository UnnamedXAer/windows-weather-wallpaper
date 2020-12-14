Unregister-ScheduledTask -TaskName "wwwupdaterTest3" -TaskPath "node"

$currentLocation = Get-Location
$action = New-ScheduledTaskAction `
 -Execute "$currentLocation\run.bat" `
 -Argument $currentLocation
$trigger = New-ScheduledTaskTrigger `
 -Once -At 14:41:12 `
 -RepetitionInterval (New-TimeSpan -Minutes 5) `
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
 -TaskName "wwwupdaterTest3" `
 -TaskPath "node" `
 -Description "testing powershell script to add scheduled task"