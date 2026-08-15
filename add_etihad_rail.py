import sys

path = "app/map/page.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

anchor = """      .addTo(leafletMap);
        });
      });
    });"""

if anchor not in content:
    print("ANCHOR NOT FOUND - ابعتلي السطور اللي قبل وبعد نهاية كود المترو")
    sys.exit(1)

addition = anchor + """

    const etihadRailLine = {
      id: "etihad-rail",
      name: "Etihad Rail",
      nameAr: "قطار الاتحاد",
      color: "#00594c",
      status: "operating",
      routes: [[
        { name: "Mohamed bin Zayed City (Abu Dhabi)", point: [24.325, 54.635] },
        { name: "Jumeirah Golf Estates (Dubai)", point: [25.0088, 55.1817] },
        { name: "Al Dhaid (Sharjah)", point: [25.288, 55.880] },
        { name: "University City (Sharjah)", point: [25.300, 55.490] },
        { name: "Al Hilal City (Fujairah)", point: [25.150, 56.340] },
      ]],
    };

    const etihadPane = leafletMap.createPane("etihadRailPane");
    etihadPane.style.zIndex = "445";
    const etihadRenderer = L.svg({ pane: "etihadRailPane", padding: 0.5 });

    etihadRailLine.routes.forEach((points) => {
      const linePoints = points.map((p) => p.point);
      L.polyline(linePoints, {
        pane: "etihadRailPane",
        renderer: etihadRenderer,
        color: etihadRailLine.color,
        weight: 5,
        opacity: 0.9,
        dashArray: "10 6",
        lineCap: "round",
        lineJoin: "round",
        className: "etihad-rail-line",
      }).addTo(leafletMap);

      points.forEach((stop) => {
        L.circleMarker(stop.point, {
          pane: "etihadRailPane",
          renderer: etihadRenderer,
          radius: 5,
          color: etihadRailLine.color,
          weight: 2,
          fillColor: "#ffffff",
          fillOpacity: 1,
          interactive: true,
          className: "etihad-rail-station",
        })
          .bindTooltip(
            `<strong>${escapeHtml(stop.name)}</strong><span>ETIHAD RAIL &middot; قطار الاتحاد</span>`,
            { direction: "top", className: "metro-stop-tooltip", opacity: 1 }
          )
          .addTo(leafletMap);
      });
    });

    const RailToggleControl = L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        const container = L.DomUtil.create("div", "leaflet-bar leaflet-control rail-toggle-control");
        container.style.background = "#fff";
        container.style.padding = "4px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "4px";

        const makeToggle = (label, paneName) => {
          const btn = L.DomUtil.create("a", "rail-toggle-btn", container);
          btn.href = "#";
          btn.innerText = label;
          btn.style.padding = "4px 8px";
          btn.style.fontSize = "12px";
          btn.style.textAlign = "center";
          btn.style.background = "#00594c";
          btn.style.color = "#fff";
          btn.style.borderRadius = "4px";
          btn.style.width = "auto";
          btn.style.height = "auto";
          btn.style.lineHeight = "1.4";

          L.DomEvent.on(btn, "click", function (e) {
            L.DomEvent.stopPropagation(e);
            L.DomEvent.preventDefault(e);
            const pane = leafletMap.getPane(paneName);
            if (!pane) return;
            const isHidden = pane.style.display === "none";
            pane.style.display = isHidden ? "" : "none";
            btn.style.opacity = isHidden ? "1" : "0.4";
          });
        };

        makeToggle("Metro", "metroNetworkPane");
        makeToggle("Etihad Rail", "etihadRailPane");

        return container;
      },
    });
    leafletMap.addControl(new RailToggleControl());"""

content = content.replace(anchor, addition, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("DONE")
