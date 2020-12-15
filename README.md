## TeKam Windows Weather Wallpaper
------

### The tool that periodically updates the windows wallpaper with current weather info.

### :memo: Implementation explanation list

- [x] Prepare project setup - empty structure with base configuration (TS, jest, git, ...).
- [x] Get weather data - call APIs for weather information.
- [x] Create image with weather info - prepare weather info-visualisation (as html) and convert it to an image.
- [x] Create wallpaper with weather info - add the weather image as an overlay to your background image.
- [x] Change windows background - set newly created wallpaper as windows background.
- [x] Add tests.
- [x] Make PowerShell script to add app to the Task Scheduler.
- [x] Run app periodically - ~~as windows service~~ or using windows task scheduler 
	or ~~make it executable and add to windows autostart~~.


### :sunrise: App work flow
- Run app via windows task scheduler.
	- Validate configuration.
	- Fetch location base on IP address.
	- Fetch weather data for the location.
	- Create copy of the default wallpaper and save it under user local folder in the app	settings file.
	- Save default wallpaper path, file as well as location info into settings file.
	- Create images with the weather informations printed in.
	- Add the weather images to the copy on wallpaper as an overlay.
	- Set newly created image as new windows background.
	- Cleans storage folder by removing old files.
