const Applet = imports.ui.applet;
const Interfaces = imports.misc.interfaces;
const PopupMenu = imports.ui.popupMenu;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;

const KeyboardBusName = "org.cinnamon.SettingsDaemon.Power.Keyboard";
const LedDir = "/sys/class/leds/smc::kbd_backlight/";

// The daemon floors raw->percent (50% is stored as 127/255 and reported as 49%),
// so derive the displayed value from the raw level, rounded to nearest.
function readInt(path) {
    try {
        let [ok, contents] = GLib.file_get_contents(path);
        return ok ? parseInt(imports.byteArray.toString(contents).trim()) : NaN;
    } catch (e) {
        return NaN;
    }
}

function rawPercent(fallback) {
    let raw = readInt(LedDir + "brightness");
    let max = readInt(LedDir + "max_brightness");
    return (raw >= 0 && max > 0) ? Math.round(raw * 100 / max) : fallback;
}

class KbdBacklightApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);
        this.set_applet_icon_symbolic_name("keyboard-brightness");
        this.set_applet_label("…");
        this.set_applet_tooltip("Keyboard backlight");

        this._proxy = null;
        this._percent = 0;
        this._seeking = false;

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this._header = new PopupMenu.PopupMenuItem("Keyboard backlight", { reactive: false });
        this.menu.addMenuItem(this._header);

        this._slider = new PopupMenu.PopupSliderMenuItem(0);
        this._slider.connect("drag-begin", () => { this._seeking = true; });
        this._slider.connect("drag-end", () => { this._seeking = false; this._set(this._slider._value * 100); });
        this._slider.connect("value-changed", (item, value) => { if (!this._seeking) this._set(value * 100); });
        this.menu.addMenuItem(this._slider);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        for (let p of [0, 25, 50, 75, 100]) {
            let item = new PopupMenu.PopupMenuItem(p === 0 ? "Off" : p + "%");
            item.connect("activate", () => this._set(p));
            this.menu.addMenuItem(item);
        }

        this.actor.connect("scroll-event", (actor, event) => this._onScroll(event));

        Interfaces.getDBusProxyAsync(KeyboardBusName, (proxy, error) => {
            if (error) {
                this.set_applet_label("n/a");
                this.set_applet_tooltip("Keyboard backlight not available");
                return;
            }
            this._proxy = proxy;
            this._proxy.connectSignal("Changed", () => this._refresh());
            this._refresh();
        });
    }

    _refresh() {
        if (!this._proxy) return;
        this._proxy.GetPercentageRemote((result, error) => {
            if (!error) this._update(result[0]);
        });
    }

    _update(percent) {
        percent = rawPercent(percent);
        this._percent = percent;
        let text = percent === 0 ? "Off" : percent + "%";
        this.set_applet_label(text);
        this.set_applet_tooltip("Keyboard backlight: " + text + "\nScroll to adjust · middle-click to toggle");
        this._header.label.set_text("Keyboard backlight: " + text);
        if (!this._seeking) this._slider.setValue(percent / 100);
    }

    _set(percent) {
        if (!this._proxy) return;
        percent = Math.max(0, Math.min(100, Math.round(percent)));
        this._proxy.SetPercentageRemote(percent, (result, error) => {
            if (!error) this._update(result[0]);
        });
    }

    _onScroll(event) {
        if (!this._proxy) return Clutter.EVENT_PROPAGATE;
        let dir = event.get_scroll_direction();
        let cb = (result, error) => { if (!error) this._update(result[0]); };
        if (dir === Clutter.ScrollDirection.UP) this._proxy.StepUpRemote(cb);
        else if (dir === Clutter.ScrollDirection.DOWN) this._proxy.StepDownRemote(cb);
        return Clutter.EVENT_STOP;
    }

    on_applet_clicked(event) {
        this._refresh();
        this.menu.toggle();
    }

    on_applet_middle_clicked(event) {
        if (this._proxy)
            this._proxy.ToggleRemote((result, error) => { if (!error) this._update(result[0]); });
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new KbdBacklightApplet(metadata, orientation, panelHeight, instanceId);
}
