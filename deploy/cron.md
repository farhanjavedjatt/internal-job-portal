# Scheduling the scraper

## Local (macOS) — `launchd`

Put this in `~/Library/LaunchAgents/work.prism.scraper.plist` (edit the paths):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>work.prism.scraper</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd "/Users/farhanjaved/Personal Projects/Job Portal/scraper" && /opt/homebrew/bin/uv run python -m scraper.run >> /tmp/prism-scraper.log 2>&amp;1</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>3</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>/tmp/prism-scraper.out</string>
  <key>StandardErrorPath</key><string>/tmp/prism-scraper.err</string>
</dict>
</plist>
```

Load:
```bash
launchctl load ~/Library/LaunchAgents/work.prism.scraper.plist
# disable
launchctl unload ~/Library/LaunchAgents/work.prism.scraper.plist
```

## VPS — systemd timer (Linux)

`/etc/systemd/system/prism-scraper.service`:
```ini
[Unit]
Description=Prism job scraper
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/prism
ExecStart=/usr/bin/docker compose -f /opt/prism/deploy/docker-compose.yml run --rm scraper
```

`/etc/systemd/system/prism-scraper.timer`:
```ini
[Unit]
Description=Run prism scraper daily

[Timer]
OnCalendar=*-*-* 03:00:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
systemctl daemon-reload
systemctl enable --now prism-scraper.timer
systemctl list-timers | grep prism
journalctl -u prism-scraper.service --since today
```

## VPS — plain crontab (alternative)

```cron
0 3 * * * cd /opt/prism/scraper && /usr/local/bin/uv run python -m scraper.run >> /var/log/prism-scraper.log 2>&1
```
