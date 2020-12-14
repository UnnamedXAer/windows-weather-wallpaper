Unregister-ScheduledTask -TaskName "wwwupdater_2" -TaskPath "node"

Register-ScheduledTask `
-TaskName "wwwupdater_2" `
-TaskPath 'node' `
-User 'DOMAIN\USER' `
-Password 'domain_password' `
-Xml (Get-Content .\wwwupdater_2.xml | Out-String) 