# Keyboard Backlight applet for Cinnamon

A small Cinnamon panel applet that shows the keyboard backlight level and lets you change it.

- **Panel label** shows the current level (e.g. `50%` or `Off`), and updates live when it changes elsewhere (e.g. with the F5/F6 keys).
- **Scroll** over it to step the level up or down.
- **Left-click** opens a slider and presets: Off / 25 / 50 / 75 / 100%.
- **Middle-click** toggles the backlight on and off.

It uses Cinnamon's power daemon (`org.cinnamon.SettingsDaemon.Power.Keyboard`). The displayed percentage is worked out from the raw LED level and rounded to the nearest whole number, because the daemon rounds down (50% would otherwise show as 49%).

Tested on a MacBook Air (6,2) running Linux Mint with Cinnamon 6.6. On other hardware, change `LedDir` in `applet.js` to your keyboard LED under `/sys/class/leds/`. If that path doesn't exist, the applet uses the daemon's value instead.

## Install

```sh
git clone <this repo> && cd cinnamon-kbd-backlight
./install.sh
```

Then add **Keyboard Backlight** from *Panel → Applets*.
