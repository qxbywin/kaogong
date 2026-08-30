    (function () {
    "use strict";
    /* 存储 */
    var K = "kaogong_";
    function load(k, def) { try { var v = localStorage.getItem(K + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
    function save(k, v) { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch (e) { if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") { toast("存储空间不足，请清理旧数据"); } } }

    /* ===== 内联 SVG 图标集（古风线描，零外链；不使用 emoji 当图标） ===== */
    function gi(p, w) {
      return '<svg class="gi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || "1.8") +
        '" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>";
    }
    var ICO = {
      clock: gi('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/>'),
      book: gi('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/>'),
      scroll: gi('<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
      checksq: gi('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12.5l3 3 5-6"/>'),
      calendar: gi('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>'),
      pie: gi('<path d="M21.2 15.9A10 10 0 1 1 8 2.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>'),
      target: gi('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>'),
      hourglass: gi('<path d="M7 2h10M7 22h10"/><path d="M8 2v4l4 5 4-5V2"/><path d="M8 22v-4l4-5 4 5v4"/>'),
      check: gi('<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>'),
      pending: gi('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>')
    };

    /* 科目（古风低饱和配色 + 印章汉字） */
    var SUBJECTS = [
      { key: "politics", name: "政治理论", ico: "政", color: "#c88f8f" },
      { key: "common",   name: "常识",     ico: "常", color: "#d9a55c" },
      { key: "verbal",   name: "言语理解", ico: "言", color: "#d3a3a3" },
      { key: "graph",    name: "图形推理", ico: "形", color: "#b9b3c9" },
      { key: "logic",    name: "判断推理", ico: "判", color: "#a9bed2" },
      { key: "data",     name: "资料分析", ico: "资", color: "#a8c9b4" },
      { key: "quant",    name: "数量关系", ico: "数", color: "#d8bd7a" },
      { key: "calc",     name: "速算",     ico: "算", color: "#bcd0a8" },
      { key: "review",   name: "复盘",     ico: "复", color: "#cbb6c4" },
      { key: "paper",    name: "套卷",     ico: "卷", color: "#b3cec2" },
      { key: "essay",    name: "申论",     ico: "论", color: "#c98a8a" }
    ];
    var SUB_MAP = {}; SUBJECTS.forEach(function (s) { SUB_MAP[s.key] = s; });

    /* 错因选项 + 颜色 */
    var ERROR_REASONS = ["知识点盲区","审题粗心失误","公式/方法遗忘","干扰选项混淆","时间不足未做完","计算失误","思路逻辑偏差","语感/素材积累不足","其他"];
    var REASON_COLORS = {
      "知识点盲区":"#c88f8f","审题粗心失误":"#d9a55c","公式/方法遗忘":"#d3a3a3","干扰选项混淆":"#b9b3c9",
      "时间不足未做完":"#a9bed2","计算失误":"#a8c9b4","思路逻辑偏差":"#d8bd7a","语感/素材积累不足":"#bcd0a8","其他":"#cbb6c4"
    };
    function reasonColor(r) { if (r && r.indexOf("其他") === 0) return REASON_COLORS["其他"]; return REASON_COLORS[r] || "#f2e2d5"; }

    /* 日期 / 格式化 */
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function todayKey(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function fmtClock(sec) { sec = Math.floor(sec); var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return pad(h) + ":" + pad(m) + ":" + pad(s); }
    function fmtDur(sec) { sec = Math.floor(sec); var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; if (h > 0) return h + "小时" + m + "分"; if (m > 0) return m + "分钟"; return s + "秒"; }
    var WK = ["日","一","二","三","四","五","六"];
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function esc(s) { return ("" + (s || "")).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

    /* 语录（每日自动更换） */
    var QUOTES = ["路虽远，行则将至；事虽难，做则必成。","你只管努力，剩下的交给时间。","今天的每一分坚持，都是明天上岸的筹码。","不是因为看到希望才坚持，而是坚持了才看到希望。","把平凡的事做到极致，就是不平凡。","与其担心未来，不如努力现在。","上岸不是终点，而是更好的起点。","奋斗的青春最美丽，拼搏的时光最珍贵。","种一棵树最好的时间是十年前，其次是现在。","越努力，越幸运。","不要假装努力，结果不会陪你演戏。","你流过的汗，终将变成录取通知书上的字。","备考很苦，但上岸很甜。","把目标刻在心里，把行动落在脚下。","所谓运气，不过是机会碰巧撞到了你的努力。","坚持到最后的人，配得上最好的结果。","不积跬步，无以至千里。","你现在的努力，是为了以后有更多的选择。","真正的稳定，来自自身的能力。","当你的才华还撑不起梦想时，就去学习。","慢慢来，比较快。","山高自有客行路，水深自有渡船人。","每一次刷题，都是在为梦想添砖加瓦。","星光不问赶路人，时光不负有心人。"];
    function todayQuote() { return QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length]; }

    /* 学习记录聚合 */
    function daily() { return load("daily", {}); }
    function todayRec() { var d = daily(); return d[todayKey()] || {}; }
    function addSeconds(subjectKey, sec) { var d = daily(); var tk = todayKey(); if (!d[tk]) d[tk] = {}; d[tk][subjectKey] = (d[tk][subjectKey] || 0) + sec; save("daily", d); }
    function dayTotal(key) { var r = daily()[key]; if (!r) return 0; var t = 0; for (var k in r) t += r[k]; return t; }
    function downloadJSON(filename, data) {
      try {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      } catch (e) { toast("导出失败：" + e.message); }
    }

    /* 弹窗 / 提示 */
    var modalRoot = document.getElementById("modalRoot"), modalTitle = document.getElementById("modalTitle"), modalBody = document.getElementById("modalBody"), modalFoot = document.getElementById("modalFoot");
    var lastFocused = null;
    function openModal(title, bodyHtml, footHtml) {
      modalTitle.textContent = title; modalBody.innerHTML = bodyHtml || ""; modalFoot.innerHTML = footHtml || "";
      modalRoot.classList.add("show"); modalRoot.setAttribute("role", "dialog"); modalRoot.setAttribute("aria-modal", "true"); modalRoot.setAttribute("aria-label", title || "弹窗");
      lastFocused = document.activeElement;
      document.body.style.overflow = "hidden";
      /* 聚焦弹窗内第一个可交互元素（或关闭按钮） */
      setTimeout(function () {
        var f = modalBody.querySelector("input, select, textarea, button, [tabindex]");
        if (f) f.focus(); else { var c = document.getElementById("modalClose"); if (c) c.focus(); }
      }, 30);
    }
    function closeModal() {
      modalRoot.classList.remove("show");
      modalRoot.removeAttribute("role"); modalRoot.removeAttribute("aria-modal"); modalRoot.removeAttribute("aria-label");
      document.body.style.overflow = "";
      modalBody.innerHTML = ""; modalFoot.innerHTML = "";
      if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) {} lastFocused = null; }
    }
    document.getElementById("modalClose").addEventListener("click", closeModal);
    modalRoot.addEventListener("click", function (e) { if (e.target === modalRoot) closeModal(); });
    /* 弹窗无障碍：ESC 关闭 + 焦点陷阱 */
    document.addEventListener("keydown", function (e) {
      if (!modalRoot.classList.contains("show")) return;
      if (e.key === "Escape" || e.key === "Esc") { closeModal(); return; }
      if (e.key === "Tab") {
        var focusables = modalRoot.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])");
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var toastEl = document.getElementById("toast"), toastTimer;
    function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2000); }

    /* SVG 饼图 */
    function polar(cx, cy, r, deg) { var a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    function donutSlice(cx, cy, rO, rI, start, end) {
      var so = polar(cx, cy, rO, start), eo = polar(cx, cy, rO, end), si = polar(cx, cy, rI, end), ei = polar(cx, cy, rI, start);
      var large = (end - start) > 180 ? 1 : 0;
      return "M" + so[0] + " " + so[1] + " A" + rO + " " + rO + " 0 " + large + " 1 " + eo[0] + " " + eo[1] + " L" + si[0] + " " + si[1] + " A" + rI + " " + rI + " 0 " + large + " 0 " + ei[0] + " " + ei[1] + " Z";
    }
    /* 实心饼图切片（从圆心到外弧） */
    function pieSlice(cx, cy, r, start, end) {
      var so = polar(cx, cy, r, start), eo = polar(cx, cy, r, end);
      var large = (end - start) > 180 ? 1 : 0;
      return "M" + cx + " " + cy + " L" + so[0] + " " + so[1] + " A" + r + " " + r + " 0 " + large + " 1 " + eo[0] + " " + eo[1] + " Z";
    }
    function drawPie(el, legendEl, items, onSlice) {
      var total = 0; items.forEach(function (i) { total += i.value; });
      if (total <= 0) { el.innerHTML = '<div class="empty">今日还没有学习记录<br>去计时器开始学习吧～</div>'; legendEl.innerHTML = ""; return; }
      var W = 475, H = 305, cx = 215, cy = 150, rO = 125, rIn = 66, rLabel = 140, minGap = 26, MINARC = 50;
      var svg = '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">';
      var pos = 0;
      var slices = items.map(function (it, oi) {
        var start = pos / total * 360, end = (pos + it.value) / total * 360; pos += it.value;
        return { it: it, oi: oi, start: start, end: end, mid: (start + end) / 2, lx: 0, ly: 0, side: "R", big: (end - start) >= MINARC };
      }).filter(function (x) { return x.it.value > 0; });
      if (slices.length === 1) {
        svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rO + '" fill="' + slices[0].it.color + '" class="slice" data-i="' + slices[0].oi + '"><title>' + slices[0].it.name + '</title></circle>';
      } else {
        slices.forEach(function (s) {
          svg += '<path d="' + pieSlice(cx, cy, rO, s.start, s.end) + '" fill="' + s.it.color + '" class="slice" data-i="' + s.oi + '"><title>' + s.it.name + '</title></path>';
        });
      }
      // 扇区内部：科目名 + 占比
      slices.forEach(function (s) {
        if (s.big) {
          var p = polar(cx, cy, rIn, s.mid);
          var pct = total > 0 ? Math.round(s.it.value / total * 100) : 0;
          svg += '<text x="' + p[0] + '" y="' + (p[1] - 2) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">' + s.it.name + '</text>';
          svg += '<text x="' + p[0] + '" y="' + (p[1] + 12) + '" text-anchor="middle" font-size="10" fill="#ffffff">' + pct + '%</text>';
        }
      });
      // 外部引导线：时长（小扇区补上名称+占比）
      if (slices.length === 1) {
        svg += '<text x="' + cx + '" y="' + (cy + rO + 18) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + slices[0].it.color + '">' + fmtDur(slices[0].it.value) + '</text>';
      } else {
        slices.forEach(function (s) {
          var p = polar(cx, cy, rLabel, s.mid);
          s.lx = p[0]; s.ly = p[1]; s.side = p[0] >= cx ? "R" : "L";
        });
        ["R", "L"].forEach(function (flag) {
          var grp = slices.filter(function (s) { return s.side === flag; }).sort(function (a, b) { return a.ly - b.ly; });
          for (var k = 1; k < grp.length; k++) { if (grp[k].ly - grp[k - 1].ly < minGap) grp[k].ly = grp[k - 1].ly + minGap; }
          if (grp.length) {
            var maxY = H - 24, minY = 14, diff = 0;
            if (grp[grp.length - 1].ly > maxY) diff = grp[grp.length - 1].ly - maxY;
            else if (grp[0].ly < minY) diff = grp[0].ly - minY;
            if (diff) grp.forEach(function (s) { s.ly -= diff; });
          }
        });
        slices.forEach(function (s) {
          var e = polar(cx, cy, rO, s.mid);
          var tx = s.side === "R" ? s.lx + 6 : s.lx - 6;
          var anchor = s.side === "R" ? "start" : "end";
          svg += '<polyline points="' + e[0] + "," + e[1] + " " + s.lx + "," + s.ly + '" fill="none" stroke="var(--text-faint)" stroke-width="1"/>';
          svg += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="2" fill="var(--text-faint)"/>';
          if (s.big) {
            svg += '<text x="' + tx + '" y="' + (s.ly + 4) + '" text-anchor="' + anchor + '" font-size="11" font-weight="700" fill="' + s.it.color + '">' + fmtDur(s.it.value) + '</text>';
          } else {
            var pct = total > 0 ? Math.round(s.it.value / total * 100) : 0;
            svg += '<text x="' + tx + '" y="' + (s.ly - 4) + '" text-anchor="' + anchor + '" font-size="11" font-weight="700" fill="' + s.it.color + '">' + s.it.name + ' ' + pct + '%</text>';
            svg += '<text x="' + tx + '" y="' + (s.ly + 10) + '" text-anchor="' + anchor + '" font-size="11" fill="var(--text-soft)">' + fmtDur(s.it.value) + '</text>';
          }
        });
      }
      svg += "</svg>";
      el.innerHTML = svg;
      var activeItems = items.filter(function (i) { return i.value > 0; }).map(function (i) {
        return { name: i.name, value: i.value, color: i.color, pct: total > 0 ? (i.value / total * 100).toFixed(1) : "0.0" };
      }).sort(function (a, b) { return b.value - a.value; });
      var listHtml = '<div class="pie-data-head">今日学习 ' + fmtDur(total) + '</div>';
      listHtml += activeItems.map(function (it) {
        return '<div class="pie-data-item"><span class="pie-dot" style="background:' + it.color + '"></span>' +
               '<span class="pie-name">' + it.name + '</span>' +
               '<span class="pie-time">' + fmtDur(it.value) + '</span>' +
               '<span class="pie-pct">' + it.pct + '%</span></div>';
      }).join("");
      legendEl.innerHTML = '<div class="pie-data-list">' + listHtml + '</div>';
      Array.prototype.forEach.call(el.querySelectorAll(".slice"), function (sd) { sd.addEventListener("click", function () { onSlice(items[+sd.getAttribute("data-i")]); }); });
    }






    /* SVG 折线图 */
    function drawLine(el, points, opts) {
      opts = opts || {};
      var tip = opts.tip, color = opts.color || "#a03a2e";
      var W = 480, H = 220, pL = 38, pR = 14, pT = 16, pB = 30, iW = W - pL - pR, iH = H - pT - pB;
      var maxV = 0; points.forEach(function (p) { if (p.value > maxV) maxV = p.value; });
      var yMax = Math.max(0.5, Math.ceil(maxV * 1.15 * 10) / 10); if (yMax <= 0) yMax = 1;
      var n = points.length, step = n > 1 ? iW / (n - 1) : 0;
      var svg = '<svg width="100%" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet">';
      for (var g = 0; g <= 4; g++) { var yv = yMax * g / 4, yy = pT + iH - (yv / yMax) * iH; svg += '<line x1="' + pL + '" y1="' + yy + '" x2="' + (W - pR) + '" y2="' + yy + '" stroke="var(--border)"/><text x="' + (pL - 6) + '" y="' + (yy + 3) + '" text-anchor="end" font-size="9" fill="var(--text-soft)">' + yv.toFixed(1) + '</text>'; }
      var path = "", dots = "";
      points.forEach(function (p, i) {
        var x = n > 1 ? pL + step * i : pL + iW / 2, y = pT + iH - (p.value / yMax) * iH;
        path += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
        var lab = tip ? tip(p) : (p.value > 0 ? fmtDur(p.value * 3600) : "0");
        dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.5" fill="' + color + '"><title>' + esc(p.label) + (lab ? "：" + lab : "") + "</title></circle>";
        var showLab = n <= 12 || i % Math.ceil(n / 10) === 0 || i === n - 1;
        if (showLab) svg += '<text x="' + x.toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="9" fill="var(--text-soft)">' + esc(p.label) + "</text>";
      });
      svg += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' + dots + "</svg>";
      el.innerHTML = svg;
    }

    /* 日期工具 + 艾宾浩斯遗忘曲线 */
    function addDays(ds, n) { var d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + n); return todayKey(d); }
    var EBB = [1, 2, 4, 7, 15, 30]; /* 学后第 N 天复习 */
    function mm(m) { return m.mastery || "review"; } /* 兼容旧数据：默认需复习 */
    function ebbInfo(m) {
      var base = m.reviewBase || m.date || todayKey(new Date(m.created || Date.now())), today = todayKey();
      var dates = EBB.map(function (d) { return addDays(base, d); });
      var next = null, dueToday = false, overdue = false;
      dates.forEach(function (d) {
        if (d === today) { dueToday = true; if (next === null) next = d; }
        else if (d < today) { overdue = true; if (next === null) next = today; }
        else { if (next === null) next = d; }
      });
      if (next === null) next = dates[dates.length - 1];
      var statusText, statusClass;
      if (dueToday) { statusText = "今天到期"; statusClass = "due"; }
      else if (overdue) { statusText = "已逾期 · 尽快复习"; statusClass = "due"; }
      else { statusText = "下次复习 " + next; statusClass = "soon"; }
      var dots = dates.map(function (d) { return { date: d, state: d < today ? "done" : (d === today ? "due" : "soon") }; });
      return { base: base, dates: dates, next: next, dueToday: dueToday, overdue: overdue, statusText: statusText, statusClass: statusClass, dots: dots };
    }
    function dueReviewCount(list) {
      var today = todayKey(), n = 0;
      list.forEach(function (m) { if (mm(m) === "mastered") return; var info = ebbInfo(m); if (info.dueToday || info.overdue) n++; });
      return n;
    }

    /* 手绘 SVG 柱状图（横向，移动端友好） */
    function drawBar(el, items, opts) {
      opts = opts || {};
      var color = opts.color || "#a03a2e";
      var maxV = 0; items.forEach(function (i) { if (i.value > maxV) maxV = i.value; });
      if (maxV <= 0) { el.innerHTML = '<div class="empty">暂无数据</div>'; return; }
      var rowH = 24, gap = 8, labelW = 92, valW = 28, padL = 4, padR = 4;
      var W = 480, H = items.length * (rowH + gap) + 8, iW = W - labelW - valW - padL - padR;
      var svg = '<svg width="100%" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid meet" class="bar-chart">';
      items.forEach(function (it, idx) {
        var y = 4 + idx * (rowH + gap), bw = maxV > 0 ? (it.value / maxV) * iW : 0;
        svg += '<text x="' + padL + '" y="' + (y + rowH / 2 + 4) + '" font-size="12" fill="var(--text-strong)">' + esc(it.name) + "</text>";
        svg += '<rect x="' + (padL + labelW) + '" y="' + y + '" width="' + iW + '" height="' + rowH + '" rx="6" fill="var(--accent-soft)"/>';
        svg += '<rect x="' + (padL + labelW) + '" y="' + y + '" width="' + bw.toFixed(1) + '" height="' + rowH + '" rx="6" fill="' + (it.color || color) + '"><title>' + esc(it.name) + "：" + it.value + " 题</title></rect>";
        svg += '<text x="' + (padL + labelW + iW + 6) + '" y="' + (y + rowH / 2 + 4) + '" font-size="12" fill="var(--text-soft)">' + it.value + "</text>";
      });
      svg += "</svg>"; el.innerHTML = svg;
    }

    /* 手绘 SVG 环形图（通用，中心可自定义文字） */
    function drawDonut(el, legendEl, items, opts) {
      opts = opts || {};
      var total = 0; items.forEach(function (i) { total += i.value; });
      if (total <= 0) { el.innerHTML = '<div class="empty">暂无数据</div>'; legendEl.innerHTML = ""; return; }
      var cx = 90, cy = 90, rO = 84, rI = 52, svg = '<svg width="180" height="180" viewBox="0 0 180 180">';
      var pos = 0; var single = items.filter(function (i) { return i.value > 0; }).length === 1;
      items.forEach(function (it, idx) {
        if (it.value <= 0) return;
        if (single) { var rmid = (rO + rI) / 2; svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + rmid + '" fill="none" stroke="' + it.color + '" stroke-width="' + (rO - rI) + '" class="slice" data-i="' + idx + '"><title>' + it.name + "</title></circle>"; }
        else { var start = pos / total * 360, end = (pos + it.value) / total * 360; pos += it.value; svg += '<path d="' + donutSlice(cx, cy, rO, rI, start, end) + '" fill="' + it.color + '" class="slice" data-i="' + idx + '"><title>' + it.name + "</title></path>"; }
      });
      svg += '<text x="90" y="86" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text-strong)">' + (opts.center || total) + "</text>";
      if (opts.centerSub) svg += '<text x="90" y="104" text-anchor="middle" font-size="11" fill="var(--text-soft)">' + opts.centerSub + "</text>";
      svg += "</svg>"; el.innerHTML = svg;
      legendEl.innerHTML = items.map(function (it) { var pct = total > 0 ? (it.value / total * 100).toFixed(1) : "0.0"; return '<div class="lg"><span class="sw" style="background:' + it.color + '"></span><span class="lg-name">' + it.name + '</span><span class="lg-val">' + it.value + " · " + pct + '%</span></div>'; }).join("");
    }

    /* 手绘 SVG 错误数热力图（GitHub 风格，按周分列） */
    function drawHeatmap(el, counts) {
      var weeks = 12, cell = 13, gap = 3, padL = 22, padT = 4;
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var endD = new Date(today), startD = new Date(endD);
      startD.setDate(startD.getDate() - (weeks * 7 - 1)); startD.setDate(startD.getDate() - startD.getDay());
      var days = [], cur = new Date(startD);
      while (cur <= endD) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
      function cf(c) {
        if (load("theme", "light") === "dark") {
          if (c <= 0) return "#3a2f36"; if (c <= 1) return "#5a3a48"; if (c <= 3) return "#7a4560"; if (c <= 5) return "#a05078"; return "#8d3728";
        }
        if (c <= 0) return "#f2e2d5"; if (c <= 1) return "#e9d3b8"; if (c <= 3) return "#d9b489"; if (c <= 5) return "#a03a2e"; return "#8d3728";
      }
      var W = padL + weeks * (cell + gap), H = padT + 7 * (cell + gap) + 2;
      var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" style="max-width:100%;">';
      var wd = ["日", "一", "二", "三", "四", "五", "六"];
      for (var r = 0; r < 7; r++) { if (r % 2 === 0) svg += '<text x="2" y="' + (padT + r * (cell + gap) + cell - 2) + '" font-size="9" fill="var(--text-soft)">' + wd[r] + "</text>"; }
      days.forEach(function (d, i) {
        var col = Math.floor(i / 7), row = d.getDay(), x = padL + col * (cell + gap), y = padT + row * (cell + gap);
        var ds = todayKey(d), c = counts[ds] || 0;
        svg += '<rect class="hm-cell" data-ds="' + ds + '" data-c="' + c + '" x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="3" fill="' + cf(c) + '"><title>' + ds + "：" + c + " 题</title></rect>";
      });
      svg += "</svg>"; el.innerHTML = svg;
      /* 自定义 tooltip（桌面 hover / 移动端点击） */
      var tip = document.createElement("div");
      tip.className = "hm-tip"; tip.style.display = "none";
      tip.textContent = "";
      el.parentNode.appendChild(tip);
      function showTip(rect, ds, c) {
        tip.textContent = ds + " 录入错题 " + c + " 题";
        tip.style.display = "block";
        var pos = rect.getBoundingClientRect(), wrap = el.getBoundingClientRect();
        tip.style.left = (pos.left - wrap.left + pos.width / 2 - 52) + "px";
        tip.style.top = (pos.top - wrap.top - 30) + "px";
      }
      el.querySelectorAll(".hm-cell").forEach(function (rect) {
        rect.addEventListener("mouseenter", function () { showTip(rect, rect.getAttribute("data-ds"), +rect.getAttribute("data-c")); });
        rect.addEventListener("mouseleave", function () { tip.style.display = "none"; });
        rect.addEventListener("click", function () { showTip(rect, rect.getAttribute("data-ds"), +rect.getAttribute("data-c")); setTimeout(function () { tip.style.display = "none"; }, 2000); });
      });
    }

    /* 打卡连续学习天数 */
    function calcStreak() {
      var d = daily(); var streak = 0; var today = new Date();
      for (var i = 0; i < 9999; i++) { /* 最多查近 30 年 */
        var dd = new Date(today); dd.setDate(dd.getDate() - i); var dk = todayKey(dd);
        var rec = d[dk]; var hasStudy = false;
        if (rec) for (var k in rec) { if (rec[k] > 0) { hasStudy = true; break; } }
        var checkins = load("checkins", []); if (checkins.indexOf(dk) >= 0) hasStudy = true;
        if (hasStudy) streak++; else break;
      }
      return streak;
    }
    function isTodayCheckedIn() {
      var checkins = load("checkins", []);
      return checkins.indexOf(todayKey()) >= 0 || dayTotal(todayKey()) > 0;
    }
    function renderCheckin() {
      var bar = document.getElementById("checkinBar"); var btn = document.getElementById("checkinBtn");
      var numEl = document.getElementById("streakNum"); if (!bar || !btn) return;
      var streak = calcStreak(); if (numEl) numEl.textContent = streak;
      if (isTodayCheckedIn()) { btn.textContent = "今日已打卡"; btn.classList.add("checked"); }
      else { btn.textContent = "今日打卡"; btn.classList.remove("checked"); }
    }
    document.getElementById("checkinBtn").addEventListener("click", function () {
      if (isTodayCheckedIn()) { toast("今天已经打卡啦"); return; }
      var checkins = load("checkins", []); checkins.push(todayKey()); save("checkins", checkins);
      renderCheckin();
      toast("打卡成功！日拱一卒，功不唐捐。");
    });

    function totalCheckins() { return load("checkins", []).length; }

    /* 学习概览 */
    function renderOverview() {
      document.getElementById("quoteText").textContent = todayQuote();
      /* 打卡连续天数 */
      renderCheckin();
      var rec = todayRec();
      var studied = 0; for (var k in rec) if (rec[k] > 0) studied++;
      var mistakes = load("mistakes", []), papers = load("papers", []);
      var sg = document.getElementById("statGrid"); sg.innerHTML = "";
      [{ ico: ICO.clock, num: fmtDur(dayTotal(todayKey())), lbl: "今日学习时长" }, { ico: ICO.book, num: studied, lbl: "今日覆盖模块" }, { ico: ICO.scroll, num: mistakes.length, lbl: "累计错题" }, { ico: ICO.checksq, num: papers.length, lbl: "完成套卷" }]
        .forEach(function (s) { var d = document.createElement("div"); d.className = "stat-card"; d.innerHTML = '<span class="ico">' + s.ico + '</span><span class="num">' + s.num + '</span><span class="lbl">' + s.lbl + "</span>"; sg.appendChild(d); });
      renderCountdowns();
      var pieItems = SUBJECTS.map(function (s) { return { name: s.name, value: rec[s.key] || 0, color: s.color }; });
      drawPie(document.getElementById("pieChart"), document.getElementById("pieLegend"), pieItems, function (it) {
        var total = pieItems.reduce(function (a, b) { return a + b.value; }, 0);
        var pct = total > 0 ? (it.value / total * 100).toFixed(1) : "0.0";
        openModal(it.name + " · 今日占比", '<div style="text-align:center;padding:10px 0;"><div style="font-size:40px;font-weight:800;color:' + it.color + '">' + fmtDur(it.value) + "</div><div style=\"margin-top:8px;color:#8a8172;\">占今日学习时长的 <b style=\"color:#a03a2e\">" + pct + "%</b></div></div>");
      });
      var wk = []; for (var i = 6; i >= 0; i--) { var d2 = new Date(); d2.setDate(d2.getDate() - i); wk.push({ label: "周" + WK[d2.getDay()], value: dayTotal(todayKey(d2)) / 3600 }); }
      drawLine(document.getElementById("weekChart"), wk);
      var now = new Date(), y = now.getFullYear(), mo = now.getMonth(), days = now.getDate(), mn = [];
      for (var dd = 1; dd <= days; dd++) { var dk = y + "-" + pad(mo + 1) + "-" + pad(dd); mn.push({ label: "" + dd, value: dayTotal(dk) / 3600 }); }
      drawLine(document.getElementById("monthChart"), mn);
      renderStudyStats();
      /* 今天要处理（逾期标红 + 一键处理） */
      renderTodayTasks();
      if (window._maybeShowBackupTip) window._maybeShowBackupTip();
    }

    /* 今天要处理：逾期错题标红、逐条一键处理；昨日未完成的自动顺延 */
    function renderTodayTasks() {
      var box = document.getElementById("reminderList"); if (!box) return;
      var mistakes = load("mistakes", []);
      var today = todayKey();
      var dueList = mistakes.filter(function (m) {
        if (mm(m) === "mastered") return false;
        var info = ebbInfo(m); return info.dueToday || info.overdue;
      }).sort(function (a, b) { return (a.date < b.date ? -1 : 1); });
      var reviews = load("reviews", []); var reviewedToday = reviews.some(function (r) { return r.date === today; });
      var papers = load("papers", []); var paperToday = papers.some(function (p) { return p.date === today; });
      var items = [];
      if (!dueList.length) items.push('<div class="reminder-item"><span class="dot ok"></span>待复习错题 <span class="rm-num">0</span> 道 · 已清空</div>');
      dueList.slice(0, 6).forEach(function (m) {
        var s = SUB_MAP[m.module]; var info = ebbInfo(m);
        var st = info.overdue ? "overdue" : "due";
        var stTxt = info.overdue ? "已逾期" : "今天到期";
        var q = (m.question || "").replace(/\s+/g, " ").trim();
        items.push('<div class="reminder-item today-item ' + st + '">' +
          '<span class="dot ' + st + '"></span>' +
          '<span class="today-q">' + esc(q ? q.slice(0, 22) + (q.length > 22 ? "…" : "") : "错题") + '</span>' +
          '<span class="today-sub">' + (s ? s.name : "其他") + '</span>' +
          '<span class="today-tag ' + st + '">' + stTxt + '</span>' +
          '<button class="btn btn-line btn-sm today-btn" data-tdone="' + m.id + '">标复习</button>' +
          '<button class="btn btn-ghost btn-sm today-btn" data-tmas="' + m.id + '">已掌握</button>' +
          '</div>');
      });
      if (dueList.length > 6) items.push('<div class="reminder-item"><span class="dot"></span>还有 ' + (dueList.length - 6) + ' 道待复习，去错题本处理 →</div>');
      items.push('<div class="reminder-item"><span class="dot' + (reviewedToday ? " ok" : "") + '"></span>今日学习复盘 ' + (reviewedToday ? ICO.check + " 已完成" : ICO.pending + " 待完成") + (reviewedToday ? "" : '<button class="btn btn-line btn-sm today-btn" data-goto="review">去复盘</button>') + '</div>');
      items.push('<div class="reminder-item"><span class="dot' + (paperToday ? " ok" : "") + '"></span>今日套卷练习 ' + (paperToday ? ICO.check + " 已录入" : ICO.pending + " 未进行") + (paperToday ? "" : '<button class="btn btn-line btn-sm today-btn" data-goto="analysis">去录入</button>') + '</div>');
      var mockCfg = load("mock_reminder", null);
      if (mockCfg && mockCfg.items && mockCfg.items.length) {
        var t0 = new Date(); t0.setHours(0, 0, 0, 0);
        var upcoming = mockCfg.items.filter(function (m) { var tm = new Date(m.date + "T00:00:00"); var d = Math.round((tm - t0) / 86400000); return d >= 0 && d <= 7; })
          .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        if (upcoming.length) {
          var nm = upcoming[0];
          items.push('<div class="reminder-item"><span class="dot"></span>近期模考 <b>' + esc(nm.name) + '</b> · ' + nm.date + (nm.time ? " " + nm.time : "") + (upcoming.length > 1 ? "（另有 " + (upcoming.length - 1) + " 场）" : "") + '</div>');
        }
      }
      if (!items.length) items.push('<div class="reminder-item"><span class="dot ok"></span>今天没有待处理事项，继续保持</div>');
      box.innerHTML = items.join("");
      /* 事件绑定：标复习 / 标已掌握 / 跳转 */
      box.querySelectorAll("[data-tdone]").forEach(function (b) {
        b.addEventListener("click", function () {
          var list = load("mistakes", []); var id = b.getAttribute("data-tdone");
          for (var i = 0; i < list.length; i++) { if (list[i].id === id) { list[i].reviewBase = todayKey(); list[i].mastery = "review"; break; } }
          save("mistakes", list); toast("已记录复习，明天进入下一轮"); renderTodayTasks(); renderCheckin();
        });
      });
      box.querySelectorAll("[data-tmas]").forEach(function (b) {
        b.addEventListener("click", function () {
          var list = load("mistakes", []); var id = b.getAttribute("data-tmas");
          for (var i = 0; i < list.length; i++) { if (list[i].id === id) { list[i].mastery = "mastered"; break; } }
          save("mistakes", list); toast("已标记掌握"); renderTodayTasks();
        });
      });
      box.querySelectorAll("[data-goto]").forEach(function (b) {
        b.addEventListener("click", function () { goPage(b.getAttribute("data-goto")); });
      });
    }

    /* 倒计时（参考图风格：emoji + 大号天数 + 副标题） */
    function renderCountdowns() {
      var list = load("countdowns", null);
      if (!list) { list = []; save("countdowns", list); }
      var box = document.getElementById("countdownList"); box.innerHTML = "";
      if (!list.length) { var hint = document.createElement("div"); hint.className = "cd-hint"; hint.textContent = "还没有考试倒计时，点右侧「+ 添加倒计时」录入你自己的考试"; box.appendChild(hint); }
      list.forEach(function (c) {
        var t = new Date(c.target + "T00:00:00"); var diff = Math.round((t - new Date(new Date().toDateString())) / 86400000);
        var base = c.color || "#a03a2e";
        var numColor = load("theme", "light") === "dark" ? lighten(base, 45) : darken(base, 8);
        var daysHtml = diff > 0 ? '<b style="color:' + numColor + '">' + diff + "</b> 天"
          : (diff === 0 ? '<b style="color:' + numColor + '">就是今天！</b>' : '已过去 <b style="color:' + numColor + '">' + (-diff) + "</b> 天");
        /* 根据考试名称自动选线描小图 */
        var icon = cdIconForName(c.name);
        var card = document.createElement("div"); card.className = "cd-card";
        card.style.background = cdGradient(c.color);
        card.innerHTML = '<button class="cd-edit" title="编辑">✎</button>' +
          '<div class="cd-icon">' + icon + '</div>' +
          '<div class="cd-name">' + esc(c.name) + '</div>' +
          '<div class="cd-days">' + daysHtml + '</div>' +
          '<div class="cd-meta">目标日 ' + c.target + '</div>';
        card.querySelector(".cd-edit").addEventListener("click", function () { editCountdown(c.id); });
        box.appendChild(card);
      });
      var add = document.createElement("button"); add.className = "cd-add"; add.textContent = "+ 添加倒计时"; add.addEventListener("click", function () { editCountdown(null); }); box.appendChild(add);
    }
    /* 倒计时图标：按考试类型给出线描小图（宫阙 / 楼阁 / 卷轴 / 盾 / 天平） */
    function cdIconForName(name) {
      var d = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
      if (!name) return d + ICO.calendar.slice(ICO.calendar.indexOf(">") + 1);
      var n = name.toLowerCase(), p = "";
      if (n.indexOf("国考") >= 0 || n.indexOf("省考") >= 0) {
        p = '<path d="M2 21h20"/><path d="M4 21V9l8-5 8 5v12"/><path d="M10 21v-7h4v7"/><path d="M7 12h2M15 12h2"/>';
      } else if (n.indexOf("事业") >= 0) {
        p = '<path d="M4 21h16"/><rect x="6" y="4" width="12" height="17" rx="1"/><path d="M10 8h1M13 8h1M10 12h1M13 12h1M10 16h1M13 16h1"/>';
      } else if (n.indexOf("选调") >= 0) {
        p = '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>';
      } else if (n.indexOf("公安") >= 0) {
        p = '<path d="M12 3l8 3v6c0 5-3.5 8.2-8 9.2-4.5-1-8-4.2-8-9.2V6z"/><path d="M9 12l2 2 4-4"/>';
      } else if (n.indexOf("法检") >= 0) {
        p = '<path d="M12 3v18"/><path d="M7 21h10"/><path d="M4 7h16"/><path d="M4 7l-2.6 5h5.2z"/><path d="M20 7l-2.6 5h5.2z"/>';
      } else {
        p = ICO.calendar.slice(ICO.calendar.indexOf(">") + 1).replace("</svg>", "");
      }
      return d + p + "</svg>";
    }
    function darken(hex, pct) {
      hex = hex.replace("#", "");
      var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      r = Math.max(0, Math.round(r * (100 - pct) / 100));
      g = Math.max(0, Math.round(g * (100 - pct) / 100));
      b = Math.max(0, Math.round(b * (100 - pct) / 100));
      return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }
    /* 倒计时卡背景：取主题色的极淡晕染（宣纸染色），保证卡上文字始终高对比可读 */
    function cdGradient(color) {
      var base = color || "#a03a2e";
      if (load("theme", "light") === "dark") {
        return "linear-gradient(145deg, " + darken(base, 66) + " 0%, " + darken(base, 58) + " 50%, " + darken(base, 50) + " 100%)";
      }
      return "linear-gradient(145deg, " + lighten(base, 80) + " 0%, " + lighten(base, 70) + " 50%, " + lighten(base, 62) + " 100%)";
    }
    function lighten(hex, pct) {
      hex = hex.replace("#", "");
      var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      r = Math.min(255, Math.round(r + (255 - r) * pct / 100));
      g = Math.min(255, Math.round(g + (255 - g) * pct / 100));
      b = Math.min(255, Math.round(b + (255 - b) * pct / 100));
      return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }

    /* 学习时长统计（时间范围切换 + 汇总卡） */
    var studyRange = "week";
    function renderStudyStats() {
      var summaryEl = document.getElementById("studySummary"); if (!summaryEl) return;
      var d = daily(); var now = new Date(); var totalSec = 0; var maxDay = 0; var dayCount = 0;
      var rangeDays;
      if (studyRange === "week") rangeDays = 7;
      else if (studyRange === "month") rangeDays = 30;
      else rangeDays = 365;
      for (var i = 0; i < rangeDays; i++) {
        var d2 = new Date(now); d2.setDate(d2.getDate() - i); var dk = todayKey(d2);
        var sec = dayTotal(dk); totalSec += sec; if (sec > 0) dayCount++;
        if (sec > maxDay) maxDay = sec;
      }
      var hours = (totalSec / 3600).toFixed(1);
      var avgMin = dayCount > 0 ? Math.round(totalSec / 60 / dayCount) : 0;
      var maxMin = Math.round(maxDay / 60);
      summaryEl.innerHTML =
        '<div class="ss-card purple"><div class="ss-num">' + hours + '</div><div class="ss-lbl">总时长(小时)</div></div>' +
        '<div class="ss-card pink"><div class="ss-num">' + avgMin + '</div><div class="ss-lbl">日均(分钟)</div></div>' +
        '<div class="ss-card green"><div class="ss-num">' + maxMin + '</div><div class="ss-lbl">最长(分钟)</div></div>';
    }
    function editCountdown(id) {
      var list = load("countdowns", []); var c = id ? list.filter(function (x) { return x.id === id; })[0] : null;
      var isNew = !c; if (isNew) c = { id: uid(), name: "", target: todayKey(new Date(new Date().getTime() + 86400000 * 30)), color: "#a03a2e" };
      openModal(isNew ? "添加倒计时" : "编辑倒计时",
        '<div class="form-row"><label>名称</label><input id="cdName" value="' + (c.name || "") + '" placeholder="如：国考" /></div><div class="form-row"><label>目标日期</label><input type="date" id="cdTarget" value="' + c.target + '" /></div><div class="form-row"><label>标记色</label><input type="color" id="cdColor" value="' + (c.color || "#a03a2e") + '" style="height:42px;padding:4px;" /></div>',
        '<button class="btn btn-line btn-sm" id="cdDel">删除</button><button class="btn btn-primary btn-sm" id="cdOk">保存</button>');
      document.getElementById("cdDel").style.display = isNew ? "none" : "";
      document.getElementById("cdDel").addEventListener("click", function () { if (confirm("确定删除该倒计时？")) { save("countdowns", list.filter(function (x) { return x.id !== id; })); closeModal(); renderCountdowns(); toast("已删除"); } });
      document.getElementById("cdOk").addEventListener("click", function () { c.name = document.getElementById("cdName").value.trim() || "倒计时"; c.target = document.getElementById("cdTarget").value; c.color = document.getElementById("cdColor").value; var found = false; for (var i = 0; i < list.length; i++) { if (list[i].id === c.id) { list[i] = c; found = true; break; } } if (!found) list.push(c); save("countdowns", list); closeModal(); renderCountdowns(); toast("已保存"); });
    }

    /* 每日时政热点（AI 生成，按天缓存；密钥/端点由用户本地配置）
       newsGen 作为「请求令牌」：每次本地命中缓存或重新发起请求时自增，
       在途请求解析后发现令牌不匹配则丢弃结果，避免旧请求覆盖新内容。 */
    var newsGen = 0;
    /* 未配置 AI 时展示的示例内容（明确标注「示例」，配置后由实时热点替换） */
    var SAMPLE_NEWS = [
      "二十届三中全会部署进一步全面深化改革",
      "高质量发展与因地制宜发展新质生产力",
      "乡村振兴战略与粮食安全最新政策要点",
      "共建「一带一路」国际合作新进展",
      "高校毕业生就业与公考招录政策动态",
      "《民法典》相关民生热点案例解读"
    ];
    /* ===== 模块学习概览 ===== */
    function renderModuleOverview() {
      var grid = document.getElementById("moduleOverviewGrid"); if (!grid) return;
      var daily = load("daily", {});
      var today = todayRec();
      var items = SUBJECTS.map(function(s) {
        var totalSec = 0;
        Object.keys(daily).forEach(function(d) { totalSec += (daily[d][s.key] || 0); });
        var todaySec = today ? (today[s.key] || 0) : 0;
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        var dur = h > 0 ? h + "h" + m + "m" : m + "分钟";
        return { ico: s.ico, name: s.name, total: dur, today: todaySec, color: s.color };
      });
      grid.innerHTML = items.map(function(it) {
        var barW = Math.min(100, Math.round(it.today / 36)); // 36 min = 100%
        return '<div class="stat-card" style="border-left:4px solid ' + it.color + '">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
          '<span class="mo-seal">' + it.ico + '</span>' +
          '<span style="font-weight:700;font-size:15px;">' + it.name + '</span></div>' +
          '<div style="font-size:13px;color:var(--text-soft);">累计 ' + it.total + '</div>' +
          '<div style="margin-top:4px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">' +
          '<div style="height:100%;width:' + barW + '%;background:' + it.color + ';border-radius:3px;transition:width .3s;"></div></div>' +
          '<div style="font-size:11px;color:var(--text-soft);margin-top:2px;">今日 ' + (it.today > 0 ? fmtDur(it.today) : "未学习") + '</div></div>';
      }).join("");
    }
    window._goModulePage = function(id) { goPage(id); };
    /* ===== 复盘总结概览 ===== */
    function renderReviewOverview() {
      var box = document.getElementById("reviewOverviewContent"); if (!box) return;
      var reviews = load("reviews", []);
      var mistakes = load("mistakes", []);
      var due = dueReviewCount(mistakes);
      var recentReviews = reviews.slice(-5).reverse();
      var daily = load("daily", {});
      var last7 = [];
      for (var i = 0; i < 7; i++) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var k = todayKey(d); last7.push(dayTotal(k));
      }
      var total7 = last7.reduce(function(a,b){return a+b;}, 0);
      var avgMin = total7 > 0 ? Math.round(total7 / 7 / 60) : 0;
      box.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:18px;">' +
        '<div class="stat-card"><span class="ico">' + ICO.book + '</span><span class="num">' + reviews.length + '</span><span class="lbl">复盘总数</span></div>' +
        '<div class="stat-card"><span class="ico">' + ICO.pending + '</span><span class="num">' + due + '</span><span class="lbl">今日待复习</span></div>' +
        '<div class="stat-card"><span class="ico">' + ICO.clock + '</span><span class="num">' + avgMin + '分钟</span><span class="lbl">近7天日均</span></div>' +
        '</div>' +
        (recentReviews.length ? '<h3 style="font-size:16px;margin-bottom:10px;">' + ICO.scroll + '近期复盘</h3>' +
        recentReviews.map(function(r) {
          return '<div class="news-card" style="margin-bottom:8px;border-left-color:' + REASON_COLORS[r.tag] + '"><div style="font-size:14px;font-weight:700;">' + r.date + ' · ' + (r.tag || "学习") + '</div>' +
            '<div style="font-size:13px;color:var(--text-soft);margin-top:4px;">' + esc((r.problems || "").substring(0, 80) + (r.problems && r.problems.length > 80 ? "..." : "")) + '</div></div>';
        }).join("") : '<div class="empty">还没有复盘记录，开始第一次复盘吧</div>');
    }
    /* ===== 套卷分析概览 ===== */
    function renderAnalysisOverview() {
      var box = document.getElementById("analysisOverviewContent"); if (!box) return;
      var papers = load("papers", []);
      var recent = papers.slice(-5).reverse();
      if (!papers.length) { box.innerHTML = '<div class="empty">还没有套卷分析记录</div>'; return; }
      var avgScore = Math.round(papers.reduce(function(s,p){return s+(p.score||0);},0) / papers.length);
      var totalCorrect = 0, totalQuestions = 0;
      papers.forEach(function(p) { if (p.modules) p.modules.forEach(function(m) { totalCorrect += correctOf(m); totalQuestions += (m.total||0); }); });
      var avgRate = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
      box.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:18px;">' +
        '<div class="stat-card"><span class="ico">' + ICO.scroll + '</span><span class="num">' + papers.length + '</span><span class="lbl">试卷总数</span></div>' +
        '<div class="stat-card"><span class="ico">' + ICO.target + '</span><span class="num">' + avgScore + '分</span><span class="lbl">平均得分</span></div>' +
        '<div class="stat-card"><span class="ico">' + ICO.check + '</span><span class="num">' + avgRate + '%</span><span class="lbl">平均正确率</span></div>' +
        '</div>' +
        '<h3 style="font-size:16px;margin-bottom:10px;">' + ICO.scroll + '近期试卷</h3>' +
        recent.map(function(p) {
          return '<div class="news-card" style="margin-bottom:8px;"><div style="font-size:14px;font-weight:700;">' + esc(p.name) + '</div>' +
            '<div style="font-size:13px;color:var(--text-soft);margin-top:4px;">' + p.date + ' · 得分 ' + (p.score||0) + ' 分 · 时长 ' + (p.duration||0) + '分钟</div></div>';
        }).join("");
    }
    function isFresh(pubDate, days) {
      if (!pubDate) return false;
      var t = Date.parse(String(pubDate).replace(/-/g, "/"));
      if (isNaN(t)) return false;
      return (Date.now() - t) <= days * 86400000;
    }
    /* ===== 时政：来源切换（内置要点 / AI 生成） =====
       来源选择持久化在 news_src，两个取值：
         "builtin" —— 内置按月要点 + 实时抓取增强，零配置、离线可用（默认）
         "ai"      —— 调用用户在设置里填的 AI 接口生成，按天缓存
       手动切换优先于「是否配置了 key」的自动判断，避免配了 key 就回不到内置。 */
    function newsSrc() { return load("news_src", "builtin") === "ai" ? "ai" : "builtin"; }
    function setNewsSrc(v, opts) {
      v = v === "ai" ? "ai" : "builtin";
      var changed = newsSrc() !== v;
      save("news_src", v);
      syncNewsSrcUI();
      /* 切回内置要点就收起 AI 设置面板：表单留在下面属于当前模式的无效区域。
         放在提前 return 之前，保证重复设置时也会收起。 */
      if (v === "builtin") {
        var panel = document.getElementById("newsSettingsPanel");
        if (panel) panel.style.display = "none";
      }
      if (!changed && !(opts && opts.force)) return;
      newsFavMode = false; newsArchiveMonth = 0; newsPage = 1; newsKw = "";
      var s = document.getElementById("newsSearch"); if (s) s.value = "";
      var sel = document.getElementById("newsArchive"); if (sel) sel.value = "";
      var ft = document.getElementById("newsFavToggle"); if (ft) ft.classList.remove("active");
      /* 先占住状态栏，避免同步渲染期间残留上一个来源的文案 */
      var up = document.getElementById("newsUpdated");
      if (up) up.textContent = v === "ai" ? "AI 生成 · 准备中…" : "内置要点 · 加载中…";
      renderNews();
    }
    function syncNewsSrcUI() {
      var m = newsSrc();
      document.querySelectorAll("#newsSrcSwitch .nsrc-btn").forEach(function (b) {
        var on = b.getAttribute("data-src") === m;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var hint = document.getElementById("newsSrcHint");
      if (hint) hint.textContent = m === "ai" ? "AI 生成 · 需配置 API 接口" : "内置要点 · 免联网兜底";
      var tip = document.getElementById("aiModeTip");
      if (tip) {
        tip.innerHTML = m === "ai"
          ? "当前模式：<b>AI 生成</b>（每日自动生成，按天缓存）。切回「内置要点」即可离线使用。"
          : "当前模式：<b>内置时政要点</b>（免费·无需配置·开箱即用）。配置后可用 AI 每日自动生成。";
      }
      var cfg = load("ai_cfg", null);
      var aiBtn = document.querySelector('#newsSrcSwitch .nsrc-btn[data-src="ai"]');
      if (aiBtn) aiBtn.title = (cfg && cfg.key && cfg.endpoint) ? "AI 接口已配置" : "尚未配置 AI 接口，点击后需先填写 API";
    }

    /* ===== 时政：收藏 / 搜索 / 按月归档 / 分页 ===== */
    var newsItems = []; var newsPage = 1; var NEWS_PAGE_SIZE = 8; var newsKw = ""; var newsFavMode = false; var newsArchiveMonth = 0;
    function loadNewsFav() { return load("news_fav", []); }
    function isNewsFav(text) { return loadNewsFav().some(function (f) { return f.title === text; }); }
    function toggleNewsFav(text) {
      var list = loadNewsFav();
      var idx = -1; list.forEach(function (f, i) { if (f.title === text) idx = i; });
      if (idx >= 0) { list.splice(idx, 1); toast("已取消收藏"); }
      else { list.push({ title: text, cat: classifyNews(text), savedAt: new Date().toISOString() }); toast("★ 已收藏"); }
      save("news_fav", list);
      renderNewsList();
    }
    function renderNewsList() {
      var box = document.getElementById("newsBox"); if (!box) return;
      var items;
      if (newsArchiveMonth > 0) items = getMonthlyNews(newsArchiveMonth);
      else items = newsItems || [];
      var favSet = loadNewsFav();
      if (newsFavMode) items = items.filter(function (t) { return favSet.some(function (f) { return f.title === nTitle(t); }); });
      if (newsKw) { var kw = newsKw.toLowerCase(); items = items.filter(function (t) { return nTitle(t).toLowerCase().indexOf(kw) >= 0; }); }
      if (!items.length) {
        box.innerHTML = '<div class="news-empty">' + (newsFavMode ? "还没有收藏的时政，点卡片右上角 ★ 收藏" : (newsArchiveMonth > 0 ? "该月暂无归档要点" : "没有匹配的时政热点")) + '</div>';
        var np0 = document.getElementById("newsPager"); if (np0) np0.innerHTML = "";
        var up0 = document.getElementById("newsUpdated"); if (up0) up0.textContent = newsFavMode ? "我的收藏" : (newsArchiveMonth > 0 ? "按月归档 · " + newsArchiveMonth + "月" : "");
        return;
      }
      var totalPages = Math.max(1, Math.ceil(items.length / NEWS_PAGE_SIZE));
      if (newsPage > totalPages) newsPage = totalPages;
      var pageItems = items.slice((newsPage - 1) * NEWS_PAGE_SIZE, newsPage * NEWS_PAGE_SIZE);
      /* 底部不再放来源切换入口：顶部已有「内置要点 / AI 生成」开关，重复按钮会误导 */
      box.innerHTML = pageItems.map(function (t, i) { return cardForNews(t, (newsPage - 1) * NEWS_PAGE_SIZE + i); }).join("");
      wireNewsClicks(box);
      var pager = document.getElementById("newsPager");
      if (pager) {
        if (totalPages <= 1) pager.innerHTML = "";
        else pager.innerHTML = '<button id="newsPrev"' + (newsPage <= 1 ? " disabled" : "") + '>‹ 上一页</button><span class="pager-info">第 ' + newsPage + ' / ' + totalPages + ' 页</span><button id="newsNext"' + (newsPage >= totalPages ? " disabled" : "") + '>下一页 ›</button>';
        var prev = document.getElementById("newsPrev"), next = document.getElementById("newsNext");
        if (prev) prev.addEventListener("click", function () { if (newsPage > 1) { newsPage--; renderNewsList(); } });
        if (next) next.addEventListener("click", function () { if (newsPage < totalPages) { newsPage++; renderNewsList(); } });
      }
      var up = document.getElementById("newsUpdated"); if (up) up.textContent = newsFavMode ? ("我的收藏 · " + items.length + " 条") : (newsArchiveMonth > 0 ? ("按月归档 · " + newsArchiveMonth + "月") : "");
    }
    /* 内置按月时政要点：开箱即用、零联网、永远可用（B 方案默认） */
    function paintBuiltinNews() {
      newsItems = getMonthlyNews(); newsArchiveMonth = 0; newsFavMode = false; newsPage = 1;
      renderNewsList();
      var up = document.getElementById("newsUpdated"); if (up) up.textContent = "内置要点 · 按月整理";
    }
    /* 打开 AI 设置面板（force=true 时强制展开并聚焦 Key） */
    function openAiSettings(force) {
      var p = document.getElementById("newsSettingsPanel"); if (!p) return;
      var open = force || p.style.display === "none";
      p.style.display = open ? "block" : "none";
      if (!open) return;
      var cfg = load("ai_cfg", null) || {};
      if (cfg.endpoint && cfg.key) { /* 已配置过，原样恢复 */
        document.getElementById("aiEndpoint").value = cfg.endpoint;
        document.getElementById("aiKey").value = cfg.key;
        document.getElementById("aiModel").value = cfg.model || "";
        /* 按地址反查服务商，方便下次切换；模型名保持用户自己的，不覆盖 */
        var hit = "custom";
        for (var pk in AI_PRESETS) { if (AI_PRESETS[pk].endpoint === cfg.endpoint) { hit = pk; break; } }
        document.getElementById("aiPreset").value = hit;
        if (hit !== "custom") document.getElementById("aiTip").textContent = AI_PRESETS[hit].tip;
      } else { /* 首次使用，默认豆包 */
        applyPreset("doubao");
        document.getElementById("aiKey").value = "";
      }
      if (force) {
        p.scrollIntoView({ block: "nearest" });
        var k = document.getElementById("aiKey"); if (k) k.focus();
      }
    }
    function renderNews() {
      syncNewsSrcUI();
      if (newsFavMode || newsArchiveMonth > 0) { renderNewsList(); return; }
      var box = document.getElementById("newsBox"); if (!box) return;
      var updated = document.getElementById("newsUpdated");

      /* ---- 模式一：AI 生成 ---- */
      if (newsSrc() === "ai") {
        var data = load("ai_news", null);
        if (data && data.date === todayKey() && data.items && data.items.length) {
          newsGen++; paintNews(data);
          if (updated) updated.textContent = "AI 生成 · 更新于 " + (data.time || "");
          return;
        }
        var cfg = load("ai_cfg", null);
        if (cfg && cfg.key && cfg.endpoint) {
          if (box.querySelector(".news-loading")) return;
          var fail = box.querySelector(".news-empty"); if (fail && fail.textContent.indexOf("生成失败") >= 0) return;
          newsGen++; var g = newsGen;
          box.innerHTML = '<div class="news-loading">AI 正在生成今日时政热点…</div>'; if (updated) updated.textContent = "";
          fetchNews(g);
          return;
        }
        /* 切到 AI 模式但还没配置接口：给出明确引导，而不是静默回退 */
        newsGen++;
        box.innerHTML = '<div class="news-empty ne-guide">尚未配置 AI 接口，无法生成今日时政。<br/>'
          + '在下方「设置」里填写 API 地址与 Key，或切回「内置要点」离线使用。'
          + '<div class="ne-actions"><button class="btn btn-primary btn-sm" id="newsGoSettings">去配置 AI</button>'
          + '<button class="btn btn-line btn-sm" id="newsBackBuiltin">切回内置要点</button></div></div>';
        if (updated) updated.textContent = "AI 生成 · 未配置";
        var npA = document.getElementById("newsPager"); if (npA) npA.innerHTML = "";
        var gsBtn = document.getElementById("newsGoSettings");
        if (gsBtn) gsBtn.addEventListener("click", function () { openAiSettings(true); });
        var bbBtn = document.getElementById("newsBackBuiltin");
        if (bbBtn) bbBtn.addEventListener("click", function () { setNewsSrc("builtin"); });
        return;
      }

      /* ---- 模式二：内置要点 ---- */
      /* 先看有没有当天的实时缓存，有就直接用 */
      var agg = load("aggregated_news", null);
      if (agg && agg.date === todayKey() && agg.items && agg.items.length) {
        newsGen++; paintNews(agg);
        if (updated) updated.textContent = "来源: " + (agg.source_summary || "多源聚合") + " · " + (agg.time || "");
        return;
      }
      var rssCache = load("rss_news", null);
      if (rssCache && rssCache.date === todayKey() && rssCache.fresh && rssCache.items && rssCache.items.length) {
        newsGen++; paintNews(rssCache);
        if (updated) updated.textContent = "来源: " + (rssCache.source || "RSS") + " · " + (rssCache.time || "");
        return;
      }
      /* 无当日缓存：先立刻铺上内置要点（秒开、离线可用），再后台尝试实时替换 */
      paintBuiltinNews();
      fetchAggregatedJson(function (ok) {
        if (ok) return;                  /* 已在内部 paint */
        if (newsSrc() !== "builtin") return;
        fetchRSSNews();                  /* 抓到新鲜内容会覆盖内置要点 */
      });
    }
    /* 拉取仓库内聚合 JSON（相对路径，兼容 GitHub Pages 子目录） */
    function fetchAggregatedJson(cb) {
      fetch("news-data.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (j) {
          if (!j || !j.items || !j.items.length) throw new Error("empty");
          /* 拉取期间用户可能已切到 AI 模式，丢弃过期结果 */
          if (newsSrc() !== "builtin") { cb(true); return; }
          var items = j.items.map(function (it) { return { title: it.title, url: it.url || "", source: it.source || "" }; });
          var data = { date: j.date, time: j.time, source_summary: j.source_summary, items: items };
          save("aggregated_news", data); newsGen++; paintNews(data);
          var up = document.getElementById("newsUpdated"); if (up) up.textContent = "来源: " + (j.source_summary || "多源聚合") + " · " + (j.time || "");
          cb(true);
        }).catch(function () { cb(false); });
    }
    /* ===== RSS 抓取（中国新闻网实时源，仅近 14 天内容才采用，避免旧闻） ===== */
    /* ===== RSS 抓取：多源 + 跨域代理兜底，聚焦公考考点，保留原文链接 ===== */
    /* 解析 RSS/Atom XML（经由跨域代理拿到的原始文本）为统一结构 */
    function parseRssXml(xml) {
      var out = [];
      try {
        var doc = new DOMParser().parseFromString(xml, "text/xml");
        var nodes = doc.querySelectorAll("item, entry");
        Array.prototype.forEach.call(nodes, function (n) {
          var tEl = n.querySelector("title"); var title = tEl ? tEl.textContent : "";
          var lEl = n.querySelector("link");
          var link = lEl ? (lEl.getAttribute("href") || lEl.textContent || "") : "";
          var pEl = n.querySelector("pubDate") || n.querySelector("published") || n.querySelector("updated");
          var pub = pEl ? pEl.textContent : "";
          if (title) out.push({ title: title, link: link, pubDate: pub });
        });
      } catch (e) {}
      return out;
    }
    function withTimeout(promise, ms) {
      var ctrl = new AbortController();
      var t = setTimeout(function () { ctrl.abort(); }, ms || 10000);
      return Promise.race([promise, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms || 10000); })]).then(function (v) { clearTimeout(t); return v; }, function (e) { clearTimeout(t); throw e; });
    }
    /* 数据源：同一订阅源走「跨域代理(XML)」与「rss2json(JSON)」两条路，再叠加一个国际源，串行兜底 */
    var RSS_SOURCES = [
      { name: "中国新闻网", fetch: function () { return withTimeout(fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://www.chinanews.com.cn/rss/scroll-news.xml"))).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }).then(parseRssXml); } },
      { name: "中国新闻网", fetch: function () { return withTimeout(fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent("https://www.chinanews.com.cn/rss/scroll-news.xml"))).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then(function (j) { if (j.status !== "ok" || !j.items) throw new Error("no items"); return j.items.map(function (it) { return { title: it.title, link: it.link, pubDate: it.pubDate }; }); }); } },
      { name: "BBC中文", fetch: function () { return withTimeout(fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://feeds.bbci.co.uk/zhongwen/simp/rss.xml"))).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }).then(parseRssXml); } }
    ];
    function fetchRSSNews() {
      var sources = RSS_SOURCES.slice();
      function tryNext() {
        if (!sources.length) { paintBuiltinNews(); toast("实时要闻抓取失败，已显示内置要点"); return; }
        var src = sources.shift();
        src.fetch().then(function (raw) {
          var fresh = raw.filter(function (it) { return isFresh(it.pubDate, 14); });
          var parsed = fresh.map(function (it) {
            var title = String(it.title || "").replace(/<[^>]+>/g, "").replace(/\[.*?\]/g, "").replace(/^\d{4}-\d{2}-\d{2}\s*/, "").trim();
            return { title: title, url: it.link || "", source: src.name, pubDate: it.pubDate, score: newsScore(title) };
          }).filter(function (o) { return o.title.length > 8; });
          /* 聚焦公考考点：相关度降序，仅采用相关度>=1 的条目 */
          var relevant = parsed.slice().sort(function (a, b) { return b.score - a.score; }).filter(function (o) { return o.score >= 1; });
          /* 抓取期间用户可能已切到 AI 模式，丢弃过期结果 */
          if (newsSrc() !== "builtin") return;
          if (relevant.length >= 3) {
            var data = { date: todayKey(), time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), items: relevant.slice(0, 8), source: src.name, fresh: true };
            save("rss_news", data); newsGen++; paintNews(data);
            var updated = document.getElementById("newsUpdated"); if (updated) updated.textContent = "来源: " + src.name + " · 聚焦公考考点 · " + data.time;
            return;
          }
          tryNext();
        }).catch(function () { tryNext(); });
      }
      tryNext();
    }
    function showSampleNews() { paintBuiltinNews(); }
    /* ===== 按月份的内置时政模板 ===== */
    function getMonthlyNews() {
      var m = new Date().getMonth() + 1;
      var templates = {
        1: ["中央一号文件聚焦乡村振兴与农业农村现代化","全国两会即将召开 · 政府工作报告起草进入关键阶段","国务院常务会议部署稳就业促消费政策措施","2026年全国公务员招录计划陆续发布","十四五规划收官之年各项部署加快落地","城乡居民基本医疗保险待遇稳步提升 · 民生保障再加力","科技创新引领新质生产力 · 战略性新兴产业加快发展","冬季能源保供与困难群众兜底帮扶工作部署"],
        2: ["全国两会开幕 · 政府工作报告发布年度经济社会发展目标","两会代表委员热议新质生产力与高质量发展","国务院机构改革方案提交审议","高校毕业生就业创业政策进一步优化","春节消费数据亮眼 · 国内大循环活力增强","中央一号文件落地 · 粮食安全与种业振兴持续推进","高水平对外开放稳步推进 · 外资准入负面清单再缩减","人工智能大模型加速应用 · 数字经济发展新动能"],
        3: ["两会闭幕 · 各项决议表决通过","国务院印发《推动大规模设备更新和消费品以旧换新行动方案》","公务员省考联考笔试举行 · 多地招录规模扩大","春季农业生产全面推进 · 粮食安全政策持续加力","政府工作报告解读 · 全年经济社会发展主要预期目标明确","营商环境改革深化 · 民营经济促进法立法推进","碳达峰碳中和稳步推进 · 绿色低碳转型加快","民生实事清单发布 · 养老托育服务体系建设加力"],
        4: ["一季度经济数据发布 · GDP增长符合预期","数字中国建设峰会召开 · 数字经济成为增长新引擎","国务院常务会议研究优化营商环境新举措","多地事业单位招聘启动 · 基层岗位需求增加","清明节缅怀英烈 · 红色文化与爱国主义教育升温","安全生产治本攻坚行动深入开展","高水平对外开放 · 自贸试验区制度创新提速","乡村振兴示范县建设推进 · 城乡融合发展迈出坚实步伐"],
        5: ["五四青年节 · 习近平总书记寄语新时代青年","全国高考备考进入冲刺阶段 · 教育改革持续推进","中国—中亚峰会成果落地 · 共建一带一路深化合作","国务院印发促进民营经济发展壮大若干措施","五一假期文旅消费火热 · 服务消费潜力释放","科技自立自强 · 关键核心技术攻关取得新突破","就业优先政策持续发力 · 重点群体就业有保障","文化和自然遗产日 · 中华优秀传统文化传承创新发展"],
        6: ["全国高考举行 · 千万考生奔赴考场","国务院常务会议部署防汛抗旱工作","上半年经济形势分析会召开 · 高质量发展扎实推进","公务员面试陆续开展 · 结构化面试技巧受关注","安全生产月活动启动 · 重点领域风险隐患排查整治","乡村振兴促进法实施成效显著 · 农村集体经济发展壮大","高校毕业生就业季 · 政策性岗位扩容稳就业","六五环境日 · 生态文明建设和生态环境保护持续推进"],
        7: ["庆祝建党105周年 · 党的建设新的伟大工程深入推进","上半年经济数据发布 · 经济运行总体平稳","二十届三中全会筹备工作推进 · 改革议题引关注","高校毕业生就业季 · 多地出台就业扶持政策","民生保障网越织越密 · 社保医保覆盖面持续扩大","科技自立自强步伐加快 · 航天与重大科技基础设施捷报频传","防汛救灾与应急管理体系不断完善","全面深化改革开放 · 统一大市场建设迈出实质性步伐"],
        8: ["国务院常务会议部署下半年经济工作","秋季开学准备工作启动 · 教育公平持续推进","粮食产量有望再创新高 · 农业现代化成效显著","国家公务员考试备考进入黄金期","建军节 · 国防和军队现代化建设迈上新台阶","科技创新驱动产业升级 · 专精特新企业培育壮大","民生改善实事落地 · 老旧小区改造与保障性住房建设加力","乡村振兴与数字乡村建设深度融合"],
        9: ["中国国际服务贸易交易会举办 · 开放型经济新体制加快构建","二十届三中全会召开 · 进一步全面深化改革","教师节表彰优秀教师 · 尊师重教氛围浓厚","国考公告即将发布 · 考生关注职位表与报考条件","中秋佳节 · 传统文化与消费促进同频共振","网络安全宣传周 · 数据安全与个人信息保护持续强化","高质量发展扎实推进 · 现代化产业体系建设加快","基层治理能力提升 · 党建引领城乡社区治理创新"],
        10:["庆祝中华人民共和国成立77周年","国家公务员考试公告发布 · 报名即将开始","二十届三中全会精神学习宣传贯彻","秋粮收购全面展开 · 粮食安全保障有力","国庆假期消费数据出炉 · 内需潜力持续释放","科技自立自强重大成果集中涌现","民生保障提标扩面 · 养老服务体系建设提速","一带一路高质量发展 · 高水平对外开放新格局"],
        11:["国考报名截止 · 报名人数再创新高","进博会成功举办 · 高水平对外开放持续推进","国务院常务会议研究明年经济社会发展思路","冬季供暖保障工作部署","双十一彰显消费韧性 · 实体经济与数字经济深度融合","科技创新赋能新质生产力 · 未来产业布局加快","乡村振兴成果巩固 · 防止返贫监测帮扶机制健全","对外开放持续深化 · 自贸协定朋友圈不断扩大"],
        12:["国考笔试举行 · 数百万考生参加","中央经济工作会议召开 · 部署明年经济工作","年度十大新闻盘点 · 时政大事回顾","新年贺词发布 · 展望2027年奋斗目标","全年经济数据收官 · 高质量发展迈出坚实步伐","民生实事年度盘点 · 群众获得感幸福感增强","法治中国建设稳步推进 · 重点领域立法不断完善","全面深化改革开放总结部署 · 中国式现代化行稳致远"]
      };
      return templates[m] || templates[1];
    }
    /* 新闻条目归一化：兼容「纯标题字符串」与「{title,url,source} 对象」 */
    function nTitle(x) { return typeof x === "string" ? x : (x && x.title) || ""; }
    function nUrl(x) { return typeof x === "string" ? "" : (x && x.url) || ""; }
    function nSource(x) { return typeof x === "string" ? "" : (x && x.source) || ""; }
    /* 考点自动标注：命中具体考试类型就标具体类型，否则默认标「申论素材」（当前时政热点本身就是申论素材来源） */
    function examTags(title) {
      var t = (title || "").toLowerCase();
      var out = [];
      if (/公务员|国考|国家公务员|行测|申论|常识判断|职位表|报名条件|笔试|面试/.test(t)) out.push({ k: "国考", e: "gk" });
      if (/省考|联考|乡镇公务员|选调生|市考|本省/.test(t)) out.push({ k: "省考", e: "sk" });
      if (/事业单位|教师招聘|三支一扶|军队文职|社区工作者|国企|卫健/.test(t)) out.push({ k: "事业单位", e: "sy" });
      if (!out.length) out.push({ k: "申论素材", e: "ss" });
      return out;
    }
    function classifyNews(text) {
      var t = text.toLowerCase();
      if (/外交|国际|联合国|美国|俄|欧盟|日韩|中东|北约|制裁|冲突|峰会|访华/.test(t)) return "international";
      if (/政策|国务院|发改委|人社|编制|公务员|考试|申论|行测|公告|招录|减税|改革|立法|修订|条例/.test(t)) return "policy";
      if (/经济|GDP|增速|通胀|贸易|供应链|产业|投资|金融|股市|货币|利率|就业|收入/.test(t)) return "economy";
      if (/科技|AI|人工智能|芯片|半导体|5G|6G|航天|卫星|数据|数字化|量子|新能源|电池/.test(t)) return "tech";
      if (/社会|民生|养老|医疗|教育|住房|消费|环保|碳|污染|食品安全|交通|人口/.test(t)) return "society";
      return "hot";
    }
    /* 公考时政相关度打分：命中的考点关键词越多分越高，用于聚焦筛选 */
    function newsScore(text) {
      var t = text.toLowerCase();
      var rules = [
        /政策|国务院|发改委|人大|政协|两会|三中|中央|改革|立法|修订|条例|公务员|编制|招录|考试|申论|行测|公告|印发|部署|会议|决议/,
        /经济|gdp|增速|通胀|贸易|产业|投资|金融|货币|利率|就业|收入|消费|税收|财政|贷款|市场/,
        /民生|养老|医疗|教育|住房|环保|碳|污染|食品安全|交通|人口|乡村振兴|农业农村|兜底/,
        /外交|国际|联合国|美国|俄|欧盟|日韩|中东|北约|制裁|冲突|峰会|访华|一带一路|中亚/,
        /科技|ai|人工智能|芯片|半导体|航天|卫星|量子|新能源|数字化|创新|数据/,
        /落马|被查|反腐|纪律|通报/
      ];
      var s = 0; rules.forEach(function (re) { if (re.test(t)) s++; }); return s;
    }
    function highlightText(text) {
      var map = [
        [/公务员/g, '<span class="nc-keyword">公务员</span>'],
        [/考试/g, '<span class="nc-keyword">考试</span>'],
        [/政策/g, '<span class="nc-keyword">政策</span>'],
        [/改革/g, '<span class="nc-keyword">改革</span>'],
        [/就业/g, '<span class="nc-keyword">就业</span>'],
        [/经济/g, '<span class="nc-keyword">经济</span>'],
        [/科技/g, '<span class="nc-keyword">科技</span>'],
        [/民生/g, '<span class="nc-keyword">民生</span>'],
        [/教育/g, '<span class="nc-keyword">教育</span>'],
        [/医疗/g, '<span class="nc-keyword">医疗</span>'],
        [/环保/g, '<span class="nc-keyword">环保</span>'],
        [/AI|人工智能/g, '<span class="nc-keyword">AI</span>'],
        [/碳/g, '<span class="nc-keyword">碳</span>'],
        [/新能源/g, '<span class="nc-keyword">新能源</span>']
      ];
      var out = esc(text);
      map.forEach(function (m) { out = out.replace(m[0], m[1]); });
      return out;
    }
    function cardForNews(item, idx) {
      var text = nTitle(item);
      var url = nUrl(item);
      var src = nSource(item);
      var cat = classifyNews(text);
      var tagLabels = { policy: "政策", international: "国际", society: "社会", economy: "经济", tech: "科技", hot: "热点" };
      var dateLabel = (function () {
        var m = text.match(/(\d{1,2})月(\d{1,2})日?/);
        if (m) return m[1] + "/" + m[2];
        return "今日";
      })();
      var fav = isNewsFav(text);
      var exams = examTags(text);
      var examHtml = exams.map(function (x) { return '<span class="nc-exam e-' + x.e + '">' + x.k + '</span>'; }).join("");
      var srcHtml = src ? '<span class="nc-src">' + esc(src) + '</span>' : "";
      var linkHtml = url ? '<a class="nc-link" href="' + escAttr(url) + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">查看原文 →</a>' : "";
      return '<div class="news-card' + (fav ? " fav" : "") + '" data-news-idx="' + (idx||0) + '" data-news-text="' + escAttr(text) + '" data-news-cat="' + cat + '">' +
        '<button class="news-star' + (fav ? " on" : "") + '" data-news-fav="' + escAttr(text) + '" title="收藏">★</button>' +
        '<span class="nc-date-tag">' + dateLabel + '</span>' +
        '<span class="nc-tag ' + cat + '">' + (tagLabels[cat] || "热点") + '</span>' +
        (examHtml ? '<span class="nc-exams">' + examHtml + '</span>' : "") +
        '<div class="nc-body">' + highlightText(text) + '</div>' +
        '<div class="nc-meta">' + (["政策","国际"].indexOf(tagLabels[cat]) >= 0 ? "重要时政 · 可能成为考点" : "值得关注的动态") + srcHtml + '</div>' +
        (linkHtml ? '<div class="nc-foot">' + linkHtml + '</div>' : "") +
        '</div>';
    }
    function escAttr(s) { return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function genNewsDetail(title, cat) {
      var catLabels = { policy: "政策文件", international: "国际关系", society: "社会民生", economy: "经济动态", tech: "科技创新", hot: "热点事件" };
      var catLabel = catLabels[cat] || "时政热点";
      var para = generateExcerpt(title, cat);
      var analysis = [
        "本条属于「" + catLabel + "」类时政，在公务员考试（行测常识判断 / 申论材料）中属于高频命题方向。",
        "备考建议：关注相关官方文件的全文表述，熟记关键数据、时间节点和责任主体，申论写作中可引用作为论据。",
        "可能命题角度："
      ];
      var angles = [];
      if (cat === "policy") angles = ["政策背景与出台目的", "与以往同类政策的对比变化", "对基层治理 / 民生的实际影响", "数据指标与量化目标"];
      else if (cat === "international") angles = ["中国的外交立场与核心利益", "对一带一路 / 全球治理的影响", "与国内政策（如双循环）的联动", "申论中可作为国际视野类论据"];
      else if (cat === "economy") angles = ["经济数据背后的结构性问题", "宏观调控手段与政策工具箱", "对就业 / 收入 / 消费的传导路径", "与高质量发展 / 新质生产力的关联"];
      else if (cat === "society") angles = ["社会问题的深层原因分析", "政府应对措施与公共服务供给", "法治保障与制度建设", "基层治理创新的典型案例"];
      else if (cat === "tech") angles = ["技术突破的战略意义", "产业链自主可控与安全", "科技伦理与法规建设", "与数字中国 / 智慧城市的关系"];
      else angles = ["事件的背景与来龙去脉", "各方的立场与回应", "事件折射出的社会 / 制度问题", "对考公人群的启示与思考"];
      var html = '<div style="padding:4px 0;line-height:1.8;font-size:15px;">';
      html += '<p style="margin-bottom:10px;font-size:16px;font-weight:700;color:#8d3728;">' + esc(title) + '</p>';
      html += '<span class="nc-tag ' + cat + '" style="margin-bottom:12px;display:inline-block;">' + (catLabels[cat] || "热点") + '</span>';
      var source = extractSource(para);
      html += '<div style="margin:8px 0 16px;padding:14px 16px;background:#fdf8ee;border-left:3px solid var(--accent);border-radius:0 10px 10px 0;font-size:14px;color:#332f28;line-height:1.9;">' + highlightText(para) + '</div>';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:13px;">' +
        '<span style="background:var(--accent-soft);color:var(--accent);padding:2px 10px;border-radius:999px;font-weight:700;">' + esc(source) + '</span>' +
        '<span style="color:var(--text-soft);">· 仅供参考学习，建议查阅原文</span></div>';
      /* 申论素材：从段落中提取可用于申论的好词好句 */
      var mat = generateMaterial(title, cat);
      if (mat.length) {
        html += '<div style="margin:12px 0 16px;padding:14px 16px;background:linear-gradient(135deg,#fdf6e4,#fdf6e4);border:1px solid rgba(199,154,63,.3);border-radius:12px;">' +
          '<div style="font-size:14px;font-weight:800;color:#8a5f1c;margin-bottom:10px;">申论素材积累</div>' +
          mat.map(function (s, i) { return '<div style="margin:6px 0;padding:6px 10px;background:rgba(255,255,255,.7);border-radius:8px;font-size:13px;color:#332f28;line-height:1.7;display:flex;gap:8px;"><span style="color:#9a6f26;font-weight:900;flex:0 0 auto;">' + (i+1) + '.</span><span>' + highlightText(s) + '</span></div>'; }).join("") +
          '</div>';
      }
      html += analysis.map(function (a) { return '<p style="margin:8px 0;">' + a + '</p>'; }).join("");
      html += '<ul style="margin:6px 0 0 18px;list-style-type:disc;">' + angles.map(function (a) { return '<li style="margin:4px 0;">' + a + '</li>'; }).join("") + '</ul>';
      html += '<p style="margin-top:14px;padding:10px 12px;background:var(--accent-soft);border-radius:10px;font-size:13px;color:#8a5a3f;">提示：上方段落为 AI 基于主题生成的参考性内容，建议查阅官方原文获取完整信息。配置 AI 后可获取每日实时热点与深度解析。</p>';
      html += '</div>';
      return html;
    }
    function extractSource(text) {
      var sources = [
        { re: /学习强国/, name: "学习强国" },
        { re: /半月谈/, name: "半月谈" }
      ];
      for (var i = 0; i < sources.length; i++) { if (sources[i].re.test(text)) return sources[i].name; }
      return "学习强国";
    }
    function generateExcerpt(title, cat) {
      var excerpts = {
        policy: [
          "【学习强国】 {title}于近日正式公布。文件明确提出，要坚持以人民为中心的发展思想，统筹推进各项重点任务，确保政策红利精准落地。相关负责人表示，此次部署是在深入调研、广泛征求意见基础上形成的，旨在破解当前发展中的瓶颈问题，为高质量发展提供制度保障。",
          "【半月谈】 记者调研发现，围绕{title}，各地已涌现出一批典型经验和创新做法。报道指出，基层干部和群众普遍认为政策贴近实际、针对性强，但在落实中仍需打通最后一公里。专家建议应加强督导评估，及时总结推广好经验好做法。",
          "【学习强国】 刊发重磅文章深入解读{title}。文章指出，要站在战略和全局的高度，充分认识此项工作的极端重要性，切实增强责任感使命感紧迫感。要注重系统性、整体性、协同性，统筹推进各项目标任务，确保党中央决策部署不折不扣落到实处。",
          "【半月谈】 {title}是当前和今后一个时期的重要政治任务。文章强调，各级党委政府要深刻认识其重大意义，准确把握核心要义，切实把思想和行动统一到中央决策部署上来。新政策在继承以往成功经验的基础上，针对新形势新任务作出了重要调整，展现出鲜明的时代特色和问题导向。"
        ],
        international: [
          "【学习强国】 关于{title}的最新进展引发国际社会广泛关注。外交部发言人在例行记者会上表示，中方一贯坚持独立自主的和平外交政策，主张通过对话协商解决分歧，维护以联合国为核心的国际体系和以国际法为基础的国际秩序。观察人士指出，中国的立场体现了负责任大国的担当。",
          "【半月谈】 发表评论文章指出，{title}再次证明了中国在国际事务中发挥着越来越重要的作用。面对百年未有之大变局，中国始终做世界和平的建设者、全球发展的贡献者、国际秩序的维护者，为动荡变革的世界注入了确定性和稳定性。",
          "【学习强国】 刊发社评指出，{title}是当前国际局势中的重要风向标。评论认为，要准确判断国际力量对比变化，坚持底线思维和极限思维，牢牢把握发展主动权。在复杂博弈中，保持战略定力尤为重要。"
        ],
        economy: [
          "【半月谈】 {title}正成为推动高质量发展的新引擎。今年以来，各地各部门积极落实中央经济工作会议精神，在扩大内需、优化供给、深化改革等方面持续发力。权威人士指出，要完整准确全面贯彻新发展理念，加快构建新发展格局。",
          "【学习强国】 刊发述评指出，{title}反映了我国经济稳中向好的基本面没有改变。数据显示，多项先行指标持续回暖，经营主体活力不断增强。我国经济韧性强、潜力大、回旋空间广，长期向好的趋势不会改变。",
          "【半月谈】 刊文分析{title}背后的深层逻辑。文章指出，经济数据的波动是结构调整过程中的正常现象，要透过短期变化看到长期趋势。当前我国经济发展质量稳步提升，新质生产力加快形成，为后续增长积蓄了力量。",
          "【学习强国】 转载经济专家解读文章指出，{title}释放出明确的政策信号。要把实施扩大内需战略同深化供给侧结构性改革有机结合起来，增强国内大循环内生动力和可靠性，提升国际循环质量和水平。"
        ],
        society: [
          "【半月谈】 {title}是当前社会治理领域的一项重要工作。近年来，各地坚持以人民为中心，不断探索创新治理模式，在保障和改善民生方面取得了显著成效。有关部门负责人表示，将持续关注群众急难愁盼问题，用心用情用力解决好群众的操心事、烦心事、揪心事。",
          "【学习强国】 报道了{title}的最新进展。报道指出，各地坚持问题导向，聚焦民生痛点，推出了一系列务实举措，取得了阶段性成效。下一步将持续加大投入力度，完善长效机制，不断提升人民群众的获得感、幸福感、安全感。",
          "【半月谈】 记者深入基层采访发现，{title}在广大群众中引发了热烈讨论。多位受访者表示，希望政策能够更加精准地回应群众需求，在就业创业、住房保障、子女教育等方面给予更多支持。有关部门已表示将认真研究吸纳社会各界的意见建议。",
          "【学习强国】 刊文指出，{title}涉及面广、社会关注度高。要从法治层面加强制度供给，完善相关法律法规，确保各项工作在法治轨道上运行。应加强部门协同联动，形成工作合力，推动问题从根本上得到解决。"
        ],
        tech: [
          "【半月谈】 {title}取得重大突破，相关成果已在国际顶级期刊发表。研究团队负责人介绍，该项技术历经多年攻关，攻克了多项关键技术难题，实现了从跟跑到并跑再到领跑的跨越。业内专家评价称，这一成果对于提升我国核心竞争力具有里程碑式意义。",
          "【学习强国】 {title}近日正式发布。工信部相关负责人表示，这是我国推进科技自立自强取得的又一重要成果。该项技术已在多个领域展开应用试点，效果显著。要抓住新一轮科技革命和产业变革机遇，加快实现高水平科技自立自强。",
          "【半月谈】 转载科技前沿报道指出，{title}标志着我国在关键核心技术领域迈出了重要一步。科技是第一生产力，创新是第一动力。要坚决打赢关键核心技术攻坚战，把科技的命脉牢牢掌握在自己手中。",
          "【学习强国】 刊发署名文章论述{title}的战略意义。文章指出，科技自立自强是国家强盛之基、安全之要。面对新一轮科技革命和产业变革，必须增强忧患意识，敏锐把握世界科技创新发展趋势。"
        ],
        hot: [
          "【学习强国】 综合多家媒体报道，{title}近日成为社会关注焦点。事件的起因和发展脉络逐渐清晰，各方观点交锋激烈。有专家指出，这一事件反映出当前社会在快速发展过程中面临的一些共性问题，值得深入思考和探讨。",
          "【半月谈】 发表评论指出，{title}不仅是一个孤立的新闻事件，更是一面镜子，折射出社会治理中的短板和不足。评论呼吁，要以开放包容的心态看待社会热点，以法治思维和法治方式化解矛盾，推动社会在解决问题中不断进步。",
          "【学习强国】 刊发评论文章认为，{title}启示我们，要始终保持清醒头脑，坚持问题导向，在应对挑战中把握机遇。越是面对复杂局面，越要坚定信心、保持定力，集中精力办好自己的事。",
          "【半月谈】 记者调查发现，{title}的背后反映了深层次的社会需求变化。多位基层干部表示，要以此次事件为契机，举一反三、标本兼治，建立健全长效工作机制，切实提升治理效能。"
        ]
      };
      var pool = excerpts[cat] || excerpts.hot;
      var tpl = pool[Math.floor(Math.random() * pool.length)];
      return tpl.replace(/\{title\}/g, title);
    }
    function generateMaterial(title, cat) {
      var materials = {
        policy: [
          "「' + title + '」是当前和今后一个时期的重要政治任务，要深刻认识其重大意义，准确把握核心要义。",
          "要坚持以人民为中心的发展思想，统筹推进各项重点任务，确保政策红利精准落地。",
          "要站在战略和全局的高度，切实增强责任感使命感紧迫感，确保党中央决策部署不折不扣落到实处。",
          "注重系统性、整体性、协同性，加强督导评估，及时总结推广好经验好做法。"
        ],
        international: [
          "面对百年未有之大变局，中国始终做世界和平的建设者、全球发展的贡献者、国际秩序的维护者。",
          "中方一贯坚持独立自主的和平外交政策，主张通过对话协商解决分歧。",
          "坚持底线思维和极限思维，牢牢把握发展主动权，在复杂博弈中保持战略定力。",
          "为推动全球治理体系改革贡献中国智慧，为动荡变革的世界注入确定性和稳定性。"
        ],
        economy: [
          "要完整准确全面贯彻新发展理念，加快构建新发展格局，着力推动经济实现良性循环。",
          "把实施扩大内需战略同深化供给侧结构性改革有机结合起来，增强国内大循环内生动力和可靠性。",
          "我国经济韧性强、潜力大、回旋空间广，长期向好的趋势不会改变。",
          "当前我国经济发展质量稳步提升，新质生产力加快形成，为后续增长积蓄了力量。"
        ],
        society: [
          "要持续关注群众急难愁盼问题，用心用情用力解决好群众的操心事、烦心事、揪心事。",
          "坚持以人民为中心，不断探索创新治理模式，在保障和改善民生方面取得扎实成效。",
          "从法治层面加强制度供给，完善相关法律法规，确保各项工作在法治轨道上运行。",
          "以法治思维和法治方式化解矛盾，推动社会在解决问题中不断进步。"
        ],
        tech: [
          "科技是第一生产力，创新是第一动力。要坚决打赢关键核心技术攻坚战。",
          "科技自立自强是国家强盛之基、安全之要，要把科技的命脉牢牢掌握在自己手中。",
          "抓住新一轮科技革命和产业变革机遇，加快实现高水平科技自立自强。",
          "敏锐把握世界科技创新发展趋势，紧紧抓住和用好新一轮科技革命和产业变革的机遇。"
        ],
        hot: [
          "越是面对复杂局面，越要坚定信心、保持定力，集中精力办好自己的事。",
          "以开放包容的心态看待社会热点，以法治思维和法治方式化解矛盾。",
          "坚持问题导向，在应对挑战中把握机遇，推动各项工作不断取得新成效。",
          "始终保持清醒头脑，增强忧患意识，牢牢把握工作主动权。"
        ]
      };
      var pool = materials[cat] || materials.hot;
      var out = [];
      for (var i = 0; i < pool.length; i++) {
        out.push(pool[i].replace(/' \+ title \+ '/g, title));
      }
      return out;
    }
    function wireNewsClicks(box) {
      if (!box) return;
      box.querySelectorAll(".news-card").forEach(function (card) {
        card.addEventListener("click", function (e) {
          if (e.target.closest(".news-star")) return; /* 收藏按钮单独处理 */
          var text = card.getAttribute("data-news-text");
          var cat = card.getAttribute("data-news-cat");
          if (text) openModal("时政详情", genNewsDetail(text, cat));
        });
      });
      box.querySelectorAll(".news-star").forEach(function (star) {
        star.addEventListener("click", function (e) {
          e.stopPropagation();
          toggleNewsFav(star.getAttribute("data-news-fav"));
        });
      });
    }
    function paintNews(data) {
      if (!data || !data.items || !data.items.length) {
        newsItems = [];
        var box = document.getElementById("newsBox"); if (box) box.innerHTML = '<div class="news-empty">今日暂无内容</div>';
        var np = document.getElementById("newsPager"); if (np) np.innerHTML = "";
        return;
      }
      newsItems = data.items; newsArchiveMonth = 0; newsFavMode = false; newsPage = 1;
      renderNewsList();
    }
    function parseNews(text) {
      if (!text) return [];
      return text.split(/\n+/).map(function (s) { return s.replace(/^[\s\d.\-\*•、]+/, "").trim(); }).filter(function (s) { return s.length > 0; }).slice(0, 8);
    }
    function fetchNews(gen) {
      var cfg = load("ai_cfg", null); if (!cfg || !cfg.key || !cfg.endpoint) { newsGen++; renderNews(); return; }
      var prompt = "你是公考备考助手。请列出今天（" + todayKey() + "）与公务员考试（行测/申论）相关的国内外时政热点 5-6 条，每条用一句话概括，聚焦可能成为考点的重大政策、会议、社会热点。只返回要点列表，不要多余解释。";
      fetch(cfg.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.key },
        body: JSON.stringify({ model: cfg.model || "deepseek-chat", messages: [{ role: "user", content: prompt }], stream: false })
      }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (j) {
          if (gen !== newsGen) return; /* 已有更新的渲染，丢弃本次过期结果 */
          var text = j && j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : "";
          var data = { date: todayKey(), items: parseNews(text), time: pad(new Date().getHours()) + ":" + pad(new Date().getMinutes()) };
          save("ai_news", data); paintNews(data);
          var up = document.getElementById("newsUpdated"); if (up) up.textContent = "AI 生成 · 更新于 " + data.time;
        }).catch(function (e) {
          if (gen !== newsGen) return; /* 过期请求，不覆盖新内容 */
          if (newsSrc() !== "ai") return; /* 期间已切回内置要点，不覆盖 */
          var b = document.getElementById("newsBox");
          if (b) b.innerHTML = '<div class="news-empty ne-guide">生成失败：' + esc(e && e.message ? e.message : "网络错误")
            + '<br/>请检查 API 设置，或确认该接口支持浏览器跨域（CORS）。'
            + '<div class="ne-actions"><button class="btn btn-primary btn-sm" id="newsFailRetry">重试</button>'
            + '<button class="btn btn-line btn-sm" id="newsFailSettings">检查设置</button>'
            + '<button class="btn btn-ghost btn-sm" id="newsFailBuiltin">切回内置要点</button></div></div>';
          var up = document.getElementById("newsUpdated"); if (up) up.textContent = "AI 生成 · 失败";
          var np = document.getElementById("newsPager"); if (np) np.innerHTML = "";
          var r1 = document.getElementById("newsFailRetry"); if (r1) r1.addEventListener("click", function () { document.getElementById("newsRefresh").click(); });
          var r2 = document.getElementById("newsFailSettings"); if (r2) r2.addEventListener("click", function () { openAiSettings(true); });
          var r3 = document.getElementById("newsFailBuiltin"); if (r3) r3.addEventListener("click", function () { setNewsSrc("builtin"); });
        });
    }
    var AI_PRESETS = {
      doubao:   { endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", model: "ep-xxxxxx", tip: "豆包（火山方舟）：模型名填「推理接入点 ID」（控制台「模型推理」里 ep- 开头的那串），API Key 在「API Key 管理」创建。无需打开豆包 App。" },
      deepseek: { endpoint: "https://api.deepseek.com/chat/completions", model: "deepseek-chat", tip: "DeepSeek：模型名填 deepseek-chat，API Key 在 platform.deepseek.com 的 API Keys 页面创建。" },
      kimi:     { endpoint: "https://api.moonshot.cn/v1/chat/completions", model: "moonshot-v1-8k", tip: "Kimi（月之暗面）：模型名填 moonshot-v1-8k，API Key 在 platform.moonshot.cn 的 API Keys 页面创建。" },
      zhipu:    { endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions", model: "glm-4.7-flash", tip: "智谱 GLM：默认 glm-4.7-flash（免费，够用），也可填 glm-4.7 / glm-5.1 / glm-5.2。API Key 在 open.bigmodel.cn 控制台「API Keys」创建，形如「32位id.32位secret」，两段都要完整复制。" },
      opencodego: { endpoint: "https://opencode.ai/zen/go/v1/chat/completions", model: "glm-5.1", tip: "OpenCode Go：OpenAI 兼容端点，模型名直接填模型 ID（默认 glm-5.1，另有 kimi-k3 / deepseek-v4-flash / mimo-v2.5 等），不用加 opencode-go/ 前缀。完整列表见 opencode.ai/zen/go/v1/models，API Key 在 opencode.ai 控制台创建。" }
    };
    function applyPreset(v) {
      var pr = AI_PRESETS[v]; if (!pr) return;
      document.getElementById("aiPreset").value = v;
      document.getElementById("aiEndpoint").value = pr.endpoint;
      document.getElementById("aiModel").value = pr.model;
      document.getElementById("aiTip").textContent = pr.tip;
    }
    document.getElementById("newsSettings").addEventListener("click", function () { openAiSettings(false); });
    /* 来源切换按钮：内置要点 ⇄ AI 生成 */
    document.querySelectorAll("#newsSrcSwitch .nsrc-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = btn.getAttribute("data-src");
        if (v === newsSrc()) return;
        if (v === "ai") {
          var cfg = load("ai_cfg", null);
          if (cfg && cfg.key && cfg.endpoint) { setNewsSrc("ai"); }
          else { setNewsSrc("ai", { force: true }); openAiSettings(true); toast("请先填写 API 地址与 Key"); }
          return;
        }
        setNewsSrc("builtin");
      });
    });
    document.getElementById("aiPreset").addEventListener("change", function () {
      var v = this.value, pr = AI_PRESETS[v]; if (!pr) return;
      document.getElementById("aiEndpoint").value = pr.endpoint;
      document.getElementById("aiModel").value = pr.model;
      document.getElementById("aiTip").textContent = pr.tip;
      if (navigator.userAgent.match(/Mobi/i)) document.getElementById("aiKey").focus();
    });
    document.getElementById("aiSave").addEventListener("click", function () {
      var cfg = { endpoint: document.getElementById("aiEndpoint").value.trim(), key: document.getElementById("aiKey").value.trim(), model: document.getElementById("aiModel").value.trim() || "deepseek-chat" };
      if (!cfg.endpoint || !cfg.key) { toast("请填写 API 地址和 Key"); return; }
      save("ai_cfg", cfg); document.getElementById("newsSettingsPanel").style.display = "none";
      toast("已保存 AI 设置，已切换到 AI 生成");
      /* 保存了配置即视为要使用 AI，自动切过去；已在 AI 模式则直接重新拉取 */
      if (newsSrc() === "ai") { save("ai_news", { date: "", items: [] }); newsGen++; renderNews(); }
      else setNewsSrc("ai");
    });
    document.getElementById("newsRefresh").addEventListener("click", function () {
      var b = document.getElementById("newsBox");
      var up = document.getElementById("newsUpdated"); if (up) up.textContent = "";
      /* AI 模式：强制重新生成 */
      if (newsSrc() === "ai") {
        var cfg = load("ai_cfg", null);
        if (!(cfg && cfg.key && cfg.endpoint)) { renderNews(); openAiSettings(true); toast("请先配置 AI 接口"); return; }
        save("ai_news", { date: "", items: [] }); newsGen++;
        if (b) b.innerHTML = '<div class="news-loading">AI 正在生成今日时政热点…</div>';
        fetchNews(newsGen);
        return;
      }
      /* 内置要点模式：尝试抓取新鲜 RSS，抓不到就保持内置要点 */
      if (b) b.innerHTML = '<div class="news-loading">正在获取最新时政…</div>';
      newsGen++; fetchRSSNews();
    });
    /* 时政：搜索 / 收藏切换 / 按月归档 */
    (function initNewsArchive() {
      var sel = document.getElementById("newsArchive"); if (!sel) return;
      for (var m = 1; m <= 12; m++) {
        var o = document.createElement("option"); o.value = m; o.textContent = m + "月时政要点"; sel.appendChild(o);
      }
    })();
    syncNewsSrcUI(); /* 恢复上次选择的时政来源 */
    document.getElementById("newsSearch").addEventListener("input", function () { newsKw = this.value.trim(); newsPage = 1; renderNewsList(); });
    document.getElementById("newsFavToggle").addEventListener("click", function () {
      newsFavMode = !newsFavMode; newsArchiveMonth = 0;
      var sel = document.getElementById("newsArchive"); if (sel) sel.value = "";
      this.classList.toggle("active", newsFavMode);
      newsPage = 1; renderNewsList();
    });
    document.getElementById("newsArchive").addEventListener("change", function () {
      newsArchiveMonth = +this.value || 0; newsFavMode = false;
      var ft = document.getElementById("newsFavToggle"); if (ft) ft.classList.remove("active");
      newsKw = ""; var s = document.getElementById("newsSearch"); if (s) s.value = "";
      newsPage = 1; renderNewsList();
    });
    /* 学习时长统计：时间范围标签切换 */
    document.querySelectorAll("#studyTabs .study-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll("#studyTabs .study-tab").forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        studyRange = tab.getAttribute("data-range") || "week";
        renderStudyStats();
      });
    });

    /* 计时器（时间戳记账：切到别的软件 / 关闭页面也能在后台继续计时） */
    var TIMER_TYPES = [
      { key: "lecture", name: "听课" },
      { key: "brush", name: "刷题" },
      { key: "recite", name: "背诵" },
      { key: "mock", name: "模考" },
      { key: "other", name: "其他" }
    ];
    var TYPE_MAP = {}; TIMER_TYPES.forEach(function (t) { TYPE_MAP[t.key] = t.name; });
    var timer = load("timer", { subject: "politics", mode: "count", type: "lecture", running: false, pomoMin: 25, name: "", segs: [], cur: null, lastBankTs: 0 });
    if (typeof timer.type !== "string" || !TYPE_MAP[timer.type]) timer.type = "lecture";
    if (!Array.isArray(timer.segs)) timer.segs = [];
    if (typeof timer.name !== "string") timer.name = "";
    if (timer.cur && typeof timer.cur !== "object") timer.cur = null;
    if (typeof timer.lastBankTs !== "number") timer.lastBankTs = 0;
    var timerInited = false;
    function curModule() { return timer.cur ? timer.cur.module : timer.subject; }
    function curSegMs() { if (!timer.cur) return 0; return timer.cur.acc + (timer.running && timer.cur.start ? Date.now() - timer.cur.start : 0); }
    function curSegSecs() { return Math.floor(curSegMs() / 1000); }
    function totalSecs() { var s = timer.segs.reduce(function (a, x) { return a + x.secs; }, 0); return s + curSegSecs(); }
    function segModName(k) { var s = SUB_MAP[k]; return s ? s.name : k; }
    function renderTimerTypes() {
      var box = document.getElementById("timerTypes"); if (!box) return;
      box.innerHTML = "";
      TIMER_TYPES.forEach(function (t) {
        var b = document.createElement("div"); b.className = "type-seg" + (timer.type === t.key ? " active" : ""); b.textContent = t.name; b.setAttribute("data-t", t.key);
        b.addEventListener("click", function () {
          if (timer.type === t.key) return;
          if (timer.running) { bankDelta(); timer.accumMs += Date.now() - timer.startTs; }
          timer.type = t.key;
          if (timer.running) { timer.startTs = Date.now(); timer.lastBankTs = Date.now(); }
          save("timer", timer); renderTimerTypes(); updateTimerTypeHint();
        });
        box.appendChild(b);
      });
    }
    function renderTimerOnce() {
      var list = document.getElementById("subjectList"); list.innerHTML = "";
      SUBJECTS.forEach(function (s) {
        var b = document.createElement("div"); b.className = "subject-btn" + (timer.subject === s.key ? " active" : ""); b.style.background = s.color; b.setAttribute("data-k", s.key);
        b.innerHTML = '<span class="sb-ico">' + s.ico + '</span><span>' + s.name + '</span><span class="sb-run" data-run="' + s.key + '"></span>';
        b.addEventListener("click", function () { tSelectSubject(s.key); });
        list.appendChild(b);
      });
      renderTimerTypes();
      timerInited = true;
    }
    function tSelectSubject(key) {
      timer.subject = key;
      save("timer", timer); markActiveSubject(); updateTimerSubjectName(); updateTimerDisplay();
    }
    function tMarkSegment() {
      if (!timer.running || !timer.cur) { toast("请先点「开始」计时"); return; }
      var firstSeg = timer.segs.length === 0;
      timer.cur.acc += Date.now() - timer.cur.start; timer.cur.start = null;
      timer.segs.push({ module: timer.cur.module, secs: Math.floor(timer.cur.acc / 1000) });
      var fromMod = timer.cur.module;
      timer.cur = { module: timer.subject, start: Date.now(), acc: 0 };
      timer.lastBankTs = Date.now();
      if (firstSeg && timer.type !== "mock") { timer.type = "mock"; renderTimerTypes(); updateTimerTypeHint(); }
      var last = timer.segs[timer.segs.length - 1];
      toast((firstSeg ? "已切换为「模考」类型，" : "已记上一段：") + segModName(last.module) + " " + fmtClock(last.secs) + (timer.subject !== fromMod ? " → 切到 " + segModName(timer.subject) : "（同科目续记）"));
      save("timer", timer); updateTimerSubjectName(); updateTimerDisplay(); renderTimerSegs();
    }
    function markActiveSubject() { document.querySelectorAll(".subject-btn").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-k") === timer.subject); }); }
    function updateTimerSubjectName() { var el = document.getElementById("timerSubjectName"); if (el) el.textContent = (SUB_MAP[curModule()] ? SUB_MAP[curModule()].name : curModule()); }
    /* 计时总时长统一用 totalSecs() 计算（含已完成各段 + 当前段） */
    function timerNotify() {
      try {
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
        if (!navigator.serviceWorker) return;
        var ms = totalSecs();
        var body = (timer.mode === "pomo"
          ? "番茄钟 剩余 " + fmtClock(Math.max(0, (timer.pomoMin || 25) * 60 - Math.floor(ms / 1000)))
          : "⏱ 已学习 " + fmtClock(Math.floor(ms / 1000))) + " · " + SUB_MAP[timer.subject].name;
        navigator.serviceWorker.ready.then(function (reg) {
          reg.showNotification("⏱ 考公工作台 · 计时中", {
            tag: "kaogong-timer", renotify: false,
            body: body, icon: "icon-192.png", badge: "icon-192.png",
            data: { page: "timer" },
            actions: [{ action: "pause", title: "暂停计时" }]
          });
        }).catch(function () {});
      } catch (e) {}
    }
    function timerNotifyClose() {
      try {
        if (!navigator.serviceWorker) return;
        navigator.serviceWorker.ready.then(function (reg) {
          reg.getNotifications({ tag: "kaogong-timer" }).then(function (list) { list.forEach(function (n) { n.close(); }); });
        }).catch(function () {});
      } catch (e) {}
    }
    function bankDelta() {
      if (!timer.running || !timer.cur) return;
      var now = Date.now(), secs = Math.floor((now - timer.lastBankTs) / 1000);
      if (secs > 0) { addSeconds(timer.cur.module, secs); addTypeSeconds(timer.type, secs); timer.lastBankTs += secs * 1000; }
    }
    function addTypeSeconds(typeKey, sec) {
      if (!typeKey) return;
      var d = load("dailyType", {}); var tk = todayKey();
      if (!d[tk]) d[tk] = {};
      d[tk][typeKey] = (d[tk][typeKey] || 0) + sec;
      save("dailyType", d);
    }
    function updateTimerTypeHint() {
      var el = document.getElementById("timerTypeHint"); if (el) el.textContent = "学习类型：" + (TYPE_MAP[timer.type] || "听课");
    }
    function renderTypeBreakdown() {
      var box = document.getElementById("typeBreakdown"); if (!box) return;
      var rec = (load("dailyType", {})[todayKey()] || {});
      var keys = TIMER_TYPES.map(function (t) { return t.key; }).filter(function (k) { return rec[k]; });
      if (!keys.length) { box.innerHTML = ""; return; }
      var max = Math.max.apply(null, keys.map(function (k) { return rec[k]; }));
      box.innerHTML = '<h3>' + ICO.book + '今日学习类型分布</h3>' + keys.map(function (k) {
        var sec = rec[k];
        var w = max > 0 ? Math.round(rec[k] / max * 100) : 0;
        return '<div class="tb-row"><span class="tb-name">' + TYPE_MAP[k] + '</span>' +
          '<span class="tb-track"><span class="tb-fill" style="width:' + w + '%"></span></span>' +
          '<span class="tb-val">' + fmtDur(sec) + '</span></div>';
      }).join("");
    }
    function updateTimerDisplay() {
      var total = totalSecs();
      var shown = timer.mode === "pomo" ? Math.max(0, (timer.pomoMin || 25) * 60 - total) : total;
      var clk = document.getElementById("timerClock"); if (clk) clk.textContent = fmtClock(shown);
      var seg = document.getElementById("timerSeg"); if (seg) seg.textContent = fmtClock(curSegSecs());
      var segn = document.getElementById("timerSegN"); if (segn) segn.textContent = timer.segs.length + (timer.cur ? 1 : 0);
      var curT = document.getElementById("segCurTime"); if (curT) curT.textContent = fmtClock(curSegSecs());
      var sc = document.getElementById("segCount"); if (sc) sc.classList.toggle("active", timer.mode === "count");
      var sp = document.getElementById("segPomo"); if (sp) sp.classList.toggle("active", timer.mode === "pomo");
      var pi = document.getElementById("pomoInput"); if (pi) pi.classList.toggle("show", timer.mode === "pomo");
      var bs = document.getElementById("btnStart"); if (bs) bs.textContent = timer.running ? "暂停" : (timer.cur ? "继续" : "开始");
      var bm = document.getElementById("btnMark"); if (bm) bm.disabled = !timer.running;
      var ns = document.getElementById("timerNextSub"); if (ns) ns.textContent = (timer.running && timer.cur && timer.subject !== timer.cur.module) ? ("下一段将计入：" + segModName(timer.subject) + "（点「记一段」切换）") : "";
      updateTimerTypeHint();
      renderTypeBreakdown();
      updateTimerResume();
    }
    function updateTimerResume() {
      var el = document.getElementById("timerResume");
      if (!el) return;
      if (timer.running) { el.textContent = "⏳ 计时进行中，切换到其他软件或关闭页面也会继续累计"; }
      else if (timer.cur || timer.segs.length) { el.textContent = "已累计 " + fmtDur(totalSecs()) + "（暂停状态，可继续、记一段或结束）"; }
      else { el.textContent = ""; }
    }
    function renderTimer() { if (!timerInited) renderTimerOnce(); updateTimerSubjectName(); updateTimerDisplay(); renderTimerSegs(); }
    function tick() {
      if (!timer.running) return;
      bankDelta();
      if (timer.mode === "pomo" && totalSecs() >= (timer.pomoMin || 25) * 60) {
        tFinish();
        toast("番茄钟完成！已自动保存本次计时");
        if (document.getElementById("page-overview").classList.contains("active")) renderOverview();
        return;
      }
      updateTimerDisplay(); timerNotify();
      if (document.getElementById("page-overview").classList.contains("active")) renderOverview();
    }
    document.getElementById("segCount").addEventListener("click", function () { timer.mode = "count"; timer.running = false; timer.cur = null; timer.segs = []; timer.lastBankTs = 0; timerNotifyClose(); save("timer", timer); updateTimerDisplay(); renderTimerSegs(); });
    document.getElementById("segPomo").addEventListener("click", function () { timer.mode = "pomo"; timer.running = false; timer.cur = null; timer.segs = []; timer.lastBankTs = 0; timerNotifyClose(); save("timer", timer); updateTimerDisplay(); renderTimerSegs(); });
    document.getElementById("pomoMin").addEventListener("change", function () { timer.pomoMin = Math.max(1, Math.min(120, +this.value || 25)); save("timer", timer); updateTimerDisplay(); });
    document.getElementById("btnStart").addEventListener("click", function () { tStartPause(); });
    function tStartPause() {
      if (timer.running) {
        bankDelta();
        if (timer.cur) { timer.cur.acc += Date.now() - timer.cur.start; timer.cur.start = null; }
        timer.running = false; timerNotifyClose();
      } else {
        if (typeof Notification !== "undefined" && Notification.permission === "default") { try { Notification.requestPermission(); } catch (e) {} }
        if (!timer.cur) timer.cur = { module: timer.subject, start: Date.now(), acc: 0 };
        else if (!timer.cur.start) timer.cur.start = Date.now();
        timer.running = true; timer.lastBankTs = Date.now(); timerNotify();
      }
      save("timer", timer); updateTimerDisplay(); renderTimerSegs();
    }
    document.getElementById("btnReset").addEventListener("click", function () { timer.running = false; timer.cur = null; timer.segs = []; timer.name = ""; timer.lastBankTs = 0; timerNotifyClose(); save("timer", timer); updateTimerDisplay(); renderTimerSegs(); toast("已重置本次计时（已用时长仍计入学习时长）"); });
    var btnFinish = document.getElementById("btnFinish"); if (btnFinish) btnFinish.addEventListener("click", function () { tFinish(); });
    var btnMark = document.getElementById("btnMark"); if (btnMark) btnMark.addEventListener("click", function () { tMarkSegment(); });
    function tFinish() {
      if (timer.cur) {
        timer.cur.acc += (timer.running && timer.cur.start ? Date.now() - timer.cur.start : 0);
        if (timer.cur.acc > 0) timer.segs.push({ module: timer.cur.module, secs: Math.floor(timer.cur.acc / 1000) });
      }
      var total = timer.segs.reduce(function (a, x) { return a + x.secs; }, 0);
      if (timer.segs.length) {
        var hist = load("segments", []);
        hist.push({ id: uid(), name: timer.name || "未命名学习", date: todayKey(), totalSecs: total, segments: timer.segs.slice(), type: timer.type });
        save("segments", hist);
        toast("已保存本次计时（" + fmtClock(total) + "），并计入学习时长");
      } else {
        toast("本次没有可保存的计时");
      }
      timer.running = false; timer.cur = null; timer.segs = []; timer.name = ""; timer.lastBankTs = 0;
      timerNotifyClose();
      save("timer", timer); updateTimerDisplay(); renderTimerSegs();
    }
    function renderTimerSegs() {
      var root = document.getElementById("segmentRoot"); if (!root) return;
      var rows = "";
      timer.segs.forEach(function (s) { var sm = SUB_MAP[s.module]; rows += '<div class="seg-row"><span class="chip" style="background:' + (sm ? sm.color : "#f2e2d5") + '">' + (sm ? sm.name : s.module) + '</span><span class="seg-time">' + fmtClock(s.secs) + '</span></div>'; });
      if (timer.cur) { var cm = SUB_MAP[timer.cur.module]; rows += '<div class="seg-row seg-cur"><span class="chip" style="background:' + (cm ? cm.color : "#f2e2d5") + '">' + (cm ? cm.name : timer.cur.module) + '（计时中）</span><span class="seg-time" id="segCurTime">' + fmtClock(curSegSecs()) + '</span></div>'; }
      var list = '<div class="card"><h3 style="margin-bottom:8px;">' + ICO.scroll + '各段记录</h3>' + (rows ? rows : '<div class="empty">还没有分段：计时中点选其他科目，再点「记一段」即可切段</div>') + '</div>';
      var byMod = {}; timer.segs.forEach(function (s) { byMod[s.module] = (byMod[s.module] || 0) + s.secs; });
      if (timer.cur) byMod[timer.cur.module] = (byMod[timer.cur.module] || 0) + curSegSecs();
      var maxv = Math.max(1, totalSecs());
      var sumRows = Object.keys(byMod).map(function (k) { var sm = SUB_MAP[k]; return '<div class="bar-row"><span class="bar-name">' + (sm ? sm.name : k) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + (byMod[k] / maxv * 100).toFixed(0) + '%"></div></div><span class="bar-val">' + fmtClock(byMod[k]) + '</span></div>'; }).join("");
      var summary = (timer.segs.length || timer.cur) ? '<div class="card"><h3>' + ICO.pie + '本次各科目时长</h3><div class="seg-total">总计 <b>' + fmtClock(totalSecs()) + '</b> · 已记 ' + (timer.segs.length + (timer.cur ? 1 : 0)) + ' 段</div>' + (sumRows || "") + '</div>' : "";
      var hist = load("segments", []); hist.sort(function (a, b) { return (b.date < a.date ? -1 : 1); });
      var histRows = hist.slice(0, 20).map(function (h) { var bm = {}; h.segments.forEach(function (s) { bm[s.module] = (bm[s.module] || 0) + s.secs; }); var mini = Object.keys(bm).map(function (k) { return segModName(k) + " " + fmtClock(bm[k]); }).join(" · "); return '<div class="seg-hist"><div class="seg-hist-h"><b>' + esc(h.name) + '</b><span class="seg-time">' + h.date + " · " + fmtClock(h.totalSecs) + '</span></div><div class="seg-hist-b">' + mini + '</div></div>'; }).join("");
      var history = '<div class="card"><h3>' + ICO.scroll + '历史记录</h3>' + (histRows ? histRows : '<div class="empty">暂无记录</div>') + '</div>';
      root.innerHTML = list + summary + history;
    }
    setInterval(tick, 1000);
    window.addEventListener("beforeunload", function () { bankDelta(); if (timer.running) timerNotify(); save("timer", timer); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") tick(); else { bankDelta(); if (timer.running) timerNotify(); save("timer", timer); } });
    /* 接收来自 Service Worker 通知按钮的消息（暂停/恢复） */
    navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'timer-action') return;
      if (e.data.action === 'toggle') {
        document.getElementById('btnStart').click();
        timerNotifyClose();
      }
    });

    /* 知识备忘录 */
    var MEMO_MODULES = ["行测", "申论"]; var memoCur = MEMO_MODULES[0]; var notePage = 1; var NOTE_PAGE_SIZE = 8;
    function renderMemoTabs() { var t = document.getElementById("memoTabs"); t.innerHTML = ""; MEMO_MODULES.forEach(function (m) { var b = document.createElement("div"); b.className = "tab" + (memoCur === m ? " active" : ""); b.textContent = m; b.addEventListener("click", function () { memoCur = m; notePage = 1; renderMemoTabs(); renderNotes(); }); t.appendChild(b); }); }
    function renderNotes() {
      var all = (load("notes", [])).filter(function (n) { return n.module === memoCur; });
      var box = document.getElementById("noteList");
      if (!all.length) { box.innerHTML = '<div class="empty">该模块还没有笔记，点击右上角新建</div>'; var np = document.getElementById("notePager"); if (np) np.innerHTML = ""; return; }
      all.sort(function (a, b) { return b.updated - a.updated; });
      var totalPages = Math.max(1, Math.ceil(all.length / NOTE_PAGE_SIZE));
      if (notePage > totalPages) notePage = totalPages;
      var notes = all.slice((notePage - 1) * NOTE_PAGE_SIZE, notePage * NOTE_PAGE_SIZE);
      box.innerHTML = notes.map(function (n) { return '<div class="item"><div class="item-head"><span class="item-title">' + esc(n.title) + '</span><span class="item-meta">' + n.updated + '</span></div><div class="item-body">' + esc(n.content) + '</div><div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + n.id + '">编辑</button><button class="btn btn-line btn-sm" data-del="' + n.id + '">删除</button></div></div>'; }).join("");
      box.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { editNote(b.getAttribute("data-edit")); }); });
      box.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("删除该笔记？")) { save("notes", load("notes", []).filter(function (x) { return x.id !== b.getAttribute("data-del"); })); renderNotes(); toast("已删除"); } }); });
      var pager = document.getElementById("notePager");
      if (!pager) return;
      if (totalPages <= 1) pager.innerHTML = "";
      else pager.innerHTML = '<button id="notePrev"' + (notePage <= 1 ? " disabled" : "") + '>‹ 上一页</button><span class="pager-info">第 ' + notePage + ' / ' + totalPages + ' 页</span><button id="noteNext"' + (notePage >= totalPages ? " disabled" : "") + '>下一页 ›</button>';
      var prev = document.getElementById("notePrev"), next = document.getElementById("noteNext");
      if (prev) prev.addEventListener("click", function () { if (notePage > 1) { notePage--; renderNotes(); } });
      if (next) next.addEventListener("click", function () { if (notePage < totalPages) { notePage++; renderNotes(); } });
    }
    function editNote(id) {
      var notes = load("notes", []); var n = id ? notes.filter(function (x) { return x.id === id; })[0] : null;
      var isNew = !n; if (isNew) n = { id: uid(), module: memoCur, title: "", content: "", updated: "" };
      openModal(isNew ? "新建笔记" : "编辑笔记",
        '<div class="form-row"><label>所属模块</label><select id="ntModule">' + MEMO_MODULES.map(function (m) { return '<option value="' + m + '"' + (m === n.module ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select></div>" +
        '<div class="form-row"><label>标题</label><input id="ntTitle" value="' + esc(n.title) + '" placeholder="笔记标题" /></div><div class="form-row"><label>内容</label><textarea id="ntContent" placeholder="素材 / 知识点">' + esc(n.content) + "</textarea></div>",
        '<button class="btn btn-primary btn-sm" id="ntOk">保存</button>');
      document.getElementById("ntOk").addEventListener("click", function () { n.module = document.getElementById("ntModule").value; n.title = document.getElementById("ntTitle").value.trim() || "未命名笔记"; n.content = document.getElementById("ntContent").value; n.updated = todayKey(); var nl = notes.filter(function (x) { return x.id !== n.id; }); nl.push(n); save("notes", nl); memoCur = n.module; closeModal(); renderMemoTabs(); renderNotes(); toast("已保存"); });
    }
    document.getElementById("addNoteBtn").addEventListener("click", function () { editNote(null); });

    /* 分模块错题本（重点优化） */
    var editingId = null;
    var mkImageData = null;
    var mkCorrectImageData = null;
    function compressImage(file, cb) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var maxW = 720, maxH = 720, w = img.width, h = img.height;
          if (w > maxW || h > maxH) { var r = Math.min(maxW / w, maxH / h); w = Math.round(w * r); h = Math.round(h * r); }
          var canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          cb(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = function () { toast("图片读取失败"); cb(null); };
        img.src = e.target.result;
      };
      reader.onerror = function () { toast("图片读取失败"); cb(null); };
      reader.readAsDataURL(file);
    }
    function showMkPreview(d) { document.getElementById("mkImgThumb").src = d; document.getElementById("mkImgPreview").style.display = "inline-block"; }
    document.getElementById("mkImgBtn").addEventListener("click", function () { document.getElementById("mkImage").click(); });
    document.getElementById("mkImage").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return;
      compressImage(f, function (d) { if (d) { mkImageData = d; showMkPreview(d); } });
      this.value = "";
    });
    document.getElementById("mkImgDel").addEventListener("click", function () { mkImageData = null; document.getElementById("mkImgPreview").style.display = "none"; document.getElementById("mkImgThumb").src = ""; });
    document.getElementById("mkCorrectImgBtn").addEventListener("click", function () { document.getElementById("mkCorrectImage").click(); });
    document.getElementById("mkCorrectImage").addEventListener("change", function () {
      var f = this.files && this.files[0]; if (!f) return;
      compressImage(f, function (d) { if (d) { mkCorrectImageData = d; document.getElementById("mkCorrectImgThumb").src = d; document.getElementById("mkCorrectImgPreview").style.display = "inline-block"; } });
      this.value = "";
    });
    document.getElementById("mkCorrectImgDel").addEventListener("click", function () { mkCorrectImageData = null; document.getElementById("mkCorrectImgPreview").style.display = "none"; document.getElementById("mkCorrectImgThumb").src = ""; });
    function fillSubjectSelect(sel, withAll) { sel.innerHTML = (withAll ? '<option value="">全部模块</option>' : "") + SUBJECTS.map(function (s) { return '<option value="' + s.key + '">' + s.name + "</option>"; }).join(""); }
    function resetMkForm() {
      editingId = null; document.getElementById("mkModule").value = SUBJECTS[0].key; document.getElementById("mkDate").value = todayKey();
      document.getElementById("mkQuestion").value = ""; document.getElementById("mkReason").value = ERROR_REASONS[0];
      document.getElementById("mkReasonOther").style.display = "none"; document.getElementById("mkReasonOther").value = "";
      document.getElementById("mkCorrect").value = ""; document.getElementById("mkSave").textContent = "保存错题"; document.getElementById("mkCancel").style.display = "none";
      mkImageData = null; document.getElementById("mkImgPreview").style.display = "none"; document.getElementById("mkImgThumb").src = "";
      mkCorrectImageData = null; document.getElementById("mkCorrectImgPreview").style.display = "none"; document.getElementById("mkCorrectImgThumb").src = "";
    }
    var mkPage = 1; var MK_PAGE_SIZE = 12; var mkBatch = false; var mkSelected = {};
    var DIFF_NAMES = { 1: "简单", 2: "中等", 3: "困难" };
    function difficultyOf(m) { var d = +m.difficulty; return DIFF_NAMES[d] ? d : 2; }
    function toggleFavorite(id) {
      var list = load("mistakes", []); for (var i = 0; i < list.length; i++) { if (list[i].id === id) { list[i].favorite = !list[i].favorite; break; } }
      save("mistakes", list); renderMistakes();
    }
    function markReviewed(id) {
      var list = load("mistakes", []); for (var i = 0; i < list.length; i++) { if (list[i].id === id) { list[i].reviewBase = todayKey(); list[i].mastery = "review"; break; } }
      save("mistakes", list); renderMistakes();
      if (document.getElementById("page-review").classList.contains("active")) { renderEbb(); renderHeatmap(); }
      toast("已记录复习，明天进入下一轮");
    }
    function filteredMistakes() {
      var filter = document.getElementById("mkFilter").value || "";
      var masVal = document.getElementById("mkMasFilter").value || "";
      var diffVal = document.getElementById("mkDiffFilter").value || "";
      var revVal = document.getElementById("mkRevFilter").value || "";
      var list = load("mistakes", []);
      if (filter) list = list.filter(function (m) { return m.module === filter; });
      if (masVal) list = list.filter(function (m) { return mm(m) === masVal; });
      if (diffVal) list = list.filter(function (m) { return String(difficultyOf(m)) === diffVal; });
      if (revVal === "fav") list = list.filter(function (m) { return !!m.favorite; });
      else if (revVal === "due") list = list.filter(function (m) { if (mm(m) === "mastered") return false; var info = ebbInfo(m); return info.dueToday || info.overdue; });
      list.sort(function (a, b) { return (b.date < a.date ? -1 : 1); });
      return list;
    }
    function renderMistakes() {
      var modVal = document.getElementById("mkModule").value || SUBJECTS[0].key;
      var filVal = document.getElementById("mkFilter").value || "";
      fillSubjectSelect(document.getElementById("mkModule"), false);
      fillSubjectSelect(document.getElementById("mkFilter"), true);
      document.getElementById("mkModule").value = modVal;
      document.getElementById("mkFilter").value = filVal;
      var lg = document.getElementById("reasonLegend");
      if (lg && !lg.childElementCount) lg.innerHTML = ERROR_REASONS.map(function (r) { return '<span class="rl-item"><span class="rl-dot" style="background:' + reasonColor(r) + '"></span>' + r + "</span>"; }).join("");
      var list = filteredMistakes();
      var box = document.getElementById("mistakeList");
      document.getElementById("mkBatchBar").style.display = mkBatch ? "block" : "none";
      document.getElementById("mkBatchInfo").textContent = list.length ? ("共 " + list.length + " 条") : "";
      var totalPages = Math.max(1, Math.ceil(list.length / MK_PAGE_SIZE));
      if (mkPage > totalPages) mkPage = totalPages;
      var pageList = list.slice((mkPage - 1) * MK_PAGE_SIZE, mkPage * MK_PAGE_SIZE);
      if (!list.length) { box.innerHTML = '<div class="empty">暂无错题</div>'; document.getElementById("mkPager").innerHTML = ""; return; }
      box.innerHTML = pageList.map(function (m) {
        var s = SUB_MAP[m.module], rc = reasonColor(m.reason), mas = mm(m), d = difficultyOf(m);
        var star = '<button class="mk-star' + (m.favorite ? " on" : "") + '" data-fav="' + m.id + '" title="收藏">' + (m.favorite ? "★" : "☆") + '</button>';
        var check = mkBatch ? '<input type="checkbox" class="mk-check" data-check="' + m.id + '"' + (mkSelected[m.id] ? " checked" : "") + ' />' : '';
        var due = (mas !== "mastered") && (function () { var info = ebbInfo(m); return info.dueToday || info.overdue; })();
        return '<div class="item reason-tint" style="border-left-color:' + rc + '"><div class="item-head">' + check +
          '<span class="chip" style="background:' + (s ? s.color : "#f2e2d5") + '">' + (s ? s.name : m.module) + '</span>' +
          '<span class="item-meta">' + m.date + '</span>' +
          '<span class="diff-badge diff-' + d + '">' + DIFF_NAMES[d] + '</span>' +
          (due ? '<span class="mk-mastery review" style="background:var(--danger-soft);color:var(--danger);">待复习</span>' : '<span class="mk-mastery ' + mas + '">' + (mas === "mastered" ? "已掌握" : "需复习") + '</span>') +
          star + '</div>' +
          '<div style="margin:6px 0;"><span class="tag-reason" style="background:' + reasonColor(m.reason) + ';color:#332f28;">' + esc(m.reason) + '</span></div>' +
          (m.image ? '<div class="mk-img-box"><img class="mk-img" src="' + m.image + '" alt="题目图片" /></div>' : "") +
          '<div class="item-body"><span class="lab">题目/错点：</span>' + esc(m.question) + "</div>" +
          '<div class="item-body"><span class="lab">正确思路：</span>' + esc(m.correct) + "</div>" +
          (m.correctImage ? '<div class="mk-img-box"><img class="mk-img" src="' + m.correctImage + '" alt="思路图片" /></div>' : "") +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + m.id + '">编辑</button><button class="btn btn-ghost btn-sm" data-mas="' + m.id + '">' + (mas === "mastered" ? "标需复习" : "标已掌握") + '</button><button class="btn btn-line btn-sm" data-rev="' + m.id + '">标复习</button>' + (hasReview(m.date) ? '<button class="btn btn-ghost btn-sm" data-rvlink="' + m.date + '">查看复盘</button>' : '') + '<button class="btn btn-line btn-sm" data-del="' + m.id + '">删除</button></div></div>';
      }).join("");
      box.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { editMistake(b.getAttribute("data-edit")); }); });
      box.querySelectorAll("[data-mas]").forEach(function (b) { b.addEventListener("click", function () { toggleMastery(b.getAttribute("data-mas")); }); });
      box.querySelectorAll("[data-rev]").forEach(function (b) { b.addEventListener("click", function () { markReviewed(b.getAttribute("data-rev")); }); });
      box.querySelectorAll("[data-fav]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); toggleFavorite(b.getAttribute("data-fav")); }); });
      box.querySelectorAll("[data-check]").forEach(function (b) { b.addEventListener("change", function () { if (b.checked) mkSelected[b.getAttribute("data-check")] = true; else delete mkSelected[b.getAttribute("data-check")]; updateMkSelCount(); }); });
      box.querySelectorAll("[data-rvlink]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); jumpToReviewByDate(b.getAttribute("data-rvlink")); }); });
      box.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("删除该错题？")) { save("mistakes", load("mistakes", []).filter(function (x) { return x.id !== b.getAttribute("data-del"); })); renderMistakes(); if (document.getElementById("page-overview").classList.contains("active")) renderOverview(); toast("已删除"); } }); });
      box.onclick = function (e) { var img = e.target.closest && e.target.closest(".mk-img"); if (img) openModal("题目图片", '<img src="' + img.getAttribute("src") + '" style="max-width:100%;border-radius:12px;" />'); };
      /* 分页 */
      var pager = document.getElementById("mkPager");
      if (totalPages <= 1) pager.innerHTML = "";
      else pager.innerHTML = '<button id="mkPrev"' + (mkPage <= 1 ? " disabled" : "") + '>‹ 上一页</button><span class="pager-info">第 ' + mkPage + ' / ' + totalPages + ' 页</span><button id="mkNext"' + (mkPage >= totalPages ? " disabled" : "") + '>下一页 ›</button>';
      var prev = document.getElementById("mkPrev"), next = document.getElementById("mkNext");
      if (prev) prev.addEventListener("click", function () { if (mkPage > 1) { mkPage--; renderMistakes(); } });
      if (next) next.addEventListener("click", function () { if (mkPage < totalPages) { mkPage++; renderMistakes(); } });
    }
    function updateMkSelCount() {
      var n = Object.keys(mkSelected).length;
      document.getElementById("mkSelCount").textContent = n ? ("已选 " + n + " 条") : "";
    }
    function toggleMastery(id) {
      var list = load("mistakes", []); var changed = null;
      for (var i = 0; i < list.length; i++) { if (list[i].id === id) { list[i].mastery = (mm(list[i]) === "mastered") ? "review" : "mastered"; changed = list[i].mastery; break; } }
      if (!changed) return;
      save("mistakes", list); renderMistakes();
      if (document.getElementById("page-overview").classList.contains("active")) renderOverview();
      if (document.getElementById("page-review").classList.contains("active")) { renderEbb(); renderHeatmap(); }
      toast(changed === "mastered" ? "已标记为掌握" : "已标记为需复习");
    }
    function editMistake(id) {
      var list = load("mistakes", []); var m = list.filter(function (x) { return x.id === id; })[0]; if (!m) return;
      editingId = id;
      mkPage = 1;
      document.getElementById("mkModule").value = m.module; document.getElementById("mkDate").value = m.date;
      document.getElementById("mkDifficulty").value = String(difficultyOf(m));
      document.getElementById("mkQuestion").value = m.question;
      var known = ERROR_REASONS.indexOf(m.reason) >= 0;
      if (known) { document.getElementById("mkReason").value = m.reason; document.getElementById("mkReasonOther").style.display = "none"; document.getElementById("mkReasonOther").value = ""; }
      else { document.getElementById("mkReason").value = "其他"; document.getElementById("mkReasonOther").style.display = "block"; document.getElementById("mkReasonOther").value = m.reason.indexOf("其他：") === 0 ? m.reason.slice(3) : m.reason; }
      document.getElementById("mkCorrect").value = m.correct;
      mkImageData = m.image || null;
      if (mkImageData) { document.getElementById("mkImgThumb").src = mkImageData; document.getElementById("mkImgPreview").style.display = "inline-block"; }
      else { document.getElementById("mkImgPreview").style.display = "none"; document.getElementById("mkImgThumb").src = ""; }
      mkCorrectImageData = m.correctImage || null;
      if (mkCorrectImageData) { document.getElementById("mkCorrectImgThumb").src = mkCorrectImageData; document.getElementById("mkCorrectImgPreview").style.display = "inline-block"; }
      else { document.getElementById("mkCorrectImgPreview").style.display = "none"; document.getElementById("mkCorrectImgThumb").src = ""; }
      document.getElementById("mkSave").textContent = "更新错题"; document.getElementById("mkCancel").style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.getElementById("mkReason").addEventListener("change", function () { document.getElementById("mkReasonOther").style.display = this.value === "其他" ? "block" : "none"; });
    document.getElementById("mkCancel").addEventListener("click", resetMkForm);
    document.getElementById("mkSave").addEventListener("click", function () {
      var module = document.getElementById("mkModule").value, date = document.getElementById("mkDate").value || todayKey();
      var q = document.getElementById("mkQuestion").value.trim();
      var reason = document.getElementById("mkReason").value;
      if (reason === "其他") { var c = document.getElementById("mkReasonOther").value.trim(); reason = c ? "其他：" + c : "其他"; }
      var correct = document.getElementById("mkCorrect").value.trim();
      if (!q && !mkImageData) { toast("请填写题目/错点，或导入题目图片"); return; }
      var difficulty = Math.min(3, Math.max(1, +document.getElementById("mkDifficulty").value || 2));
      var list = load("mistakes", []);
      if (editingId) { var idx = -1; for (var i = 0; i < list.length; i++) if (list[i].id === editingId) idx = i; if (idx >= 0) { list[idx] = { id: editingId, module: module, date: date, question: q, reason: reason, correct: correct, image: mkImageData, correctImage: mkCorrectImageData, created: list[idx].created, mastery: list[idx].mastery || "review", favorite: !!list[idx].favorite, reviewBase: list[idx].reviewBase || "", difficulty: difficulty }; } editingId = null; }
      else { list.push({ id: uid(), module: module, date: date, question: q, reason: reason, correct: correct, image: mkImageData, correctImage: mkCorrectImageData, created: Date.now(), mastery: "review", favorite: false, reviewBase: "", difficulty: difficulty }); }
      save("mistakes", list); resetMkForm(); renderMistakes(); toast("已保存错题");
    });
    document.getElementById("mkFilter").addEventListener("change", function () { mkPage = 1; renderMistakes(); });
    document.getElementById("mkMasFilter").addEventListener("change", function () { mkPage = 1; renderMistakes(); });
    document.getElementById("mkDiffFilter").addEventListener("change", function () { mkPage = 1; renderMistakes(); });
    document.getElementById("mkRevFilter").addEventListener("change", function () { mkPage = 1; renderMistakes(); });
    /* 批量导出 */
    document.getElementById("mkBatchBtn").addEventListener("click", function () { mkBatch = !mkBatch; mkSelected = {}; updateMkSelCount(); renderMistakes(); });
    document.getElementById("mkBatchCancel").addEventListener("click", function () { mkBatch = false; mkSelected = {}; updateMkSelCount(); renderMistakes(); });
    document.getElementById("mkSelectAll").addEventListener("change", function () {
      var checked = this.checked;
      var pageIds = filteredMistakes().slice((mkPage - 1) * MK_PAGE_SIZE, mkPage * MK_PAGE_SIZE).map(function (m) { return m.id; });
      pageIds.forEach(function (id) { if (checked) mkSelected[id] = true; else delete mkSelected[id]; });
      updateMkSelCount(); renderMistakes();
    });
    document.getElementById("mkExportSel").addEventListener("click", function () {
      var ids = Object.keys(mkSelected);
      if (!ids.length) { toast("请先勾选要导出的错题"); return; }
      var list = load("mistakes", []).filter(function (m) { return mkSelected[m.id]; });
      downloadJSON("错题本_选中" + ids.length + "条_" + todayKey() + ".json", list);
      toast("已导出 " + list.length + " 条错题");
    });
    document.getElementById("mkExportAll").addEventListener("click", function () {
      var list = load("mistakes", []);
      if (!list.length) { toast("暂无错题可导出"); return; }
      downloadJSON("错题本_全部" + list.length + "条_" + todayKey() + ".json", list);
      toast("已导出全部 " + list.length + " 条错题");
    });

    /* 每日学习复盘（优化） */
    var REVIEW_TAGS = ["时间安排问题","知识点薄弱","做题粗心","答题技巧不足","心态/效率问题","申论写作问题","其他"];
    var REVIEW_MAX = 500;
    var editingReviewId = null;
    var rvExpanded = {};
    function clampRv(el) { if (el.value.length > REVIEW_MAX) el.value = el.value.slice(0, REVIEW_MAX); }
    function updateRvCounts() {
      var p = document.getElementById("rvProblems"), pl = document.getElementById("rvPlan");
      clampRv(p); clampRv(pl);
      var pc = document.getElementById("rvProblemsCount"), plc = document.getElementById("rvPlanCount");
      pc.textContent = p.value.length + " / " + REVIEW_MAX; plc.textContent = pl.value.length + " / " + REVIEW_MAX;
      pc.classList.toggle("limit", p.value.length >= REVIEW_MAX); plc.classList.toggle("limit", pl.value.length >= REVIEW_MAX);
    }
    function resetRvForm() {
      editingReviewId = null;
      document.getElementById("rvDate").value = todayKey();
      var tsel = document.getElementById("rvTag");
      tsel.innerHTML = REVIEW_TAGS.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
      tsel.value = REVIEW_TAGS[0];
      document.getElementById("rvProblems").value = "";
      document.getElementById("rvPlan").value = "";
      document.getElementById("rvSave").textContent = "保存复盘";
      document.getElementById("rvCancel").style.display = "none";
      updateRvCounts();
    }
    function loadTodayReviewIntoForm() {
      var list = load("reviews", []);
      var r = list.filter(function (x) { return x.date === todayKey(); })[0];
      if (!r) return;
      editingReviewId = r.id;
      var tsel = document.getElementById("rvTag");
      tsel.innerHTML = REVIEW_TAGS.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
      tsel.value = r.tag || REVIEW_TAGS[0];
      document.getElementById("rvProblems").value = r.problems || "";
      document.getElementById("rvPlan").value = r.plan || "";
      document.getElementById("rvSave").textContent = "更新复盘";
      document.getElementById("rvCancel").style.display = "inline-block";
      updateRvCounts();
    }
    /* ===== 复盘联动：与同日错题 / 套卷互相关联跳转 ===== */
    function linkedEntries(date) {
      var mistakes = load("mistakes", []).filter(function (m) { return (m.date || todayKey(new Date(m.created || Date.now()))) === date; });
      var papers = load("papers", []).filter(function (p) { return p.date === date; });
      return { mistakes: mistakes, papers: papers };
    }
    function hasReview(date) { return load("reviews", []).some(function (r) { return r.date === date; }); }
    function linkageHtml(date) {
      var lk = linkedEntries(date);
      if (!lk.mistakes.length && !lk.papers.length) return "";
      var h = '<div class="rv-link">同日记录：';
      lk.mistakes.slice(0, 4).forEach(function (m) {
        h += '<button class="link-chip" data-lmk="' + m.id + '">' + esc((m.question || m.reason || "错题").slice(0, 10)) + '</button>';
      });
      if (lk.mistakes.length > 4) h += '<span class="link-more">+' + (lk.mistakes.length - 4) + ' 题</span>';
      if (lk.papers.length) h += '<button class="link-chip" data-lpp="' + lk.papers[0].id + '">' + esc(lk.papers[0].name.slice(0, 10)) + '</button>';
      h += '<button class="link-jump" data-lgoto="mistakes">看错题 ›</button><button class="link-jump" data-lgoto="analysis">看套卷 ›</button>';
      return h + '</div>';
    }
    function wireReviewLinkage(box) {
      if (!box) return;
      box.querySelectorAll("[data-lmk]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); editMistake(b.getAttribute("data-lmk")); }); });
      box.querySelectorAll("[data-lpp]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); viewPaper(b.getAttribute("data-lpp")); }); });
      box.querySelectorAll("[data-lgoto]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); goPage(b.getAttribute("data-lgoto")); }); });
    }
    function viewPaper(id) {
      var list = load("papers", []); var p = list.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      var html = '<div style="font-size:16px;font-weight:700;margin-bottom:6px;">' + esc(p.name) + '</div><div class="item-meta" style="margin-bottom:8px;">' + p.date + (p.duration ? " · 时长 " + p.duration + " 分钟" : "") + (p.score !== "" && p.score != null ? " · 分数 " + p.score : "") + '</div>';
      var mods = p.modules;
      if (mods) {
        var total = 0, correct = 0;
        for (var k in mods) { total += mods[k].total || 0; correct += correctOf(mods[k]); }
        html += '<div style="margin:6px 0 10px;">总题量 <b>' + total + '</b> · 答对数 <b>' + correct + '</b> · 正确率 <b>' + (total > 0 ? (correct / total * 100).toFixed(1) : "0.0") + '%</b></div>';
      }
      if (p.note) html += '<div style="margin-top:8px;padding:12px;background:var(--accent-soft);border-radius:10px;line-height:1.7;">' + esc(p.note) + '</div>';
      openModal("套卷详情", html);
    }
    function jumpToReviewByDate(date) {
      goPage("review");
      var list = load("reviews", []);
      var r = list.filter(function (x) { return x.date === date; })[0];
      if (r) editReview(r.id);
      else toast("该日期暂无复盘，可在「每日学习复盘」新建");
    }
    function renderReviews() {
      var filVal = document.getElementById("rvFilter").value || "";
      var fsel = document.getElementById("rvFilter");
      fsel.innerHTML = '<option value="">全部标签</option>' + REVIEW_TAGS.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
      fsel.value = filVal;
      var filter = filVal;
      var list = load("reviews", []); if (filter) list = list.filter(function (r) { return (r.tag || "其他") === filter; });
      list.sort(function (a, b) { return b.date === a.date ? (b.created || 0) - (a.created || 0) : (b.date < a.date ? -1 : 1); });
      var box = document.getElementById("reviewList");
      if (!list.length) { box.innerHTML = '<div class="empty">暂无复盘记录</div>'; renderEbb(); renderHeatmap(); return; }
      box.innerHTML = list.map(function (r) {
        var tag = r.tag || "其他";
        var exp = !!rvExpanded[r.id];
        var preview = ((r.problems || r.plan || "").replace(/\n/g, " ")).slice(0, 42);
        var bodyHtml = exp
          ? '<div class="item-body">' + (r.problems ? '<span class="lab">学习问题：</span>' + esc(r.problems) + (r.plan ? '<br>' : '') : '') + (r.plan ? '<span class="lab">改进计划：</span>' + esc(r.plan) : '') + '</div>'
          : (preview ? '<div class="item-body" style="color:#8a8172;">' + esc(preview) + (preview.length >= 42 ? "…" : "") + '</div>' : '');
        return '<div class="item"><div class="item-head"><span class="item-title">' + ICO.calendar + ' ' + r.date + '</span><span class="chip">' + tag + '</span>' +
          '<button class="btn btn-ghost btn-sm" data-toggle="' + r.id + '">' + (exp ? "收起" : "展开") + '</button></div>' +
          bodyHtml +
          linkageHtml(r.date) +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-edit="' + r.id + '">编辑</button><button class="btn btn-line btn-sm" data-del="' + r.id + '">删除</button></div></div>';
      }).join("");
      box.querySelectorAll("[data-toggle]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); var id = b.getAttribute("data-toggle"); rvExpanded[id] = !rvExpanded[id]; renderReviews(); }); });
      box.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { editReview(b.getAttribute("data-edit")); }); });
      box.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("删除该复盘？")) { save("reviews", load("reviews", []).filter(function (x) { return x.id !== b.getAttribute("data-del"); })); renderReviews(); toast("已删除"); } }); });
      wireReviewLinkage(box);
    }
    function renderEbb() {
      var list = load("mistakes", []);
      var dueEl = document.getElementById("ebbDue"), listEl = document.getElementById("ebbList");
      if (!dueEl || !listEl) return;
      var active = list.filter(function (m) { return mm(m) !== "mastered"; });
      if (!active.length) { dueEl.textContent = ""; listEl.innerHTML = '<div class="empty">全部已掌握，暂无待复习错题</div>'; return; }
      var dueCount = dueReviewCount(active);
      dueEl.textContent = dueCount > 0 ? ("今日待复习 " + dueCount + " 题") : "今天没有到期复习，保持节奏";
      var rows = active.map(function (m) { return { m: m, info: ebbInfo(m) }; }).sort(function (a, b) { return a.info.next < b.info.next ? -1 : 1; });
      listEl.innerHTML = rows.map(function (r) {
        var m = r.m, info = r.info, s = SUB_MAP[m.module];
        var dots = info.dots.map(function (d) { var c = d.state === "done" ? "#a03a2e" : (d.state === "due" ? "#9a6f26" : "#e2d5bf"); return '<span class="ebb-dot" style="background:' + c + '" title="' + d.date + '"></span>'; }).join("");
        return '<div class="ebb-row"><span class="chip" style="background:' + (s ? s.color : "#f2e2d5") + '">' + (s ? s.name : m.module) + '</span>' +
          '<span class="ebb-name">' + esc(m.question || m.reason || "错题") + '</span>' +
          '<span class="ebb-next ' + (info.statusClass === "due" ? "ebb-due" : "") + '">' + info.statusText + '</span>' +
          '<span class="ebb-dots">' + dots + '</span></div>';
      }).join("");
    }
    function renderHeatmap() {
      var el = document.getElementById("heatMap"); if (!el) return;
      var list = load("mistakes", []), counts = {};
      list.forEach(function (m) { var d = m.date || todayKey(new Date(m.created || Date.now())); counts[d] = (counts[d] || 0) + 1; });
      drawHeatmap(el, counts);
    }
    function editReview(id) {
      var list = load("reviews", []); var r = list.filter(function (x) { return x.id === id; })[0]; if (!r) return;
      editingReviewId = id;
      document.getElementById("rvDate").value = r.date;
      var tsel = document.getElementById("rvTag");
      tsel.innerHTML = REVIEW_TAGS.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join("");
      tsel.value = r.tag || REVIEW_TAGS[0];
      document.getElementById("rvProblems").value = r.problems || "";
      document.getElementById("rvPlan").value = r.plan || "";
      document.getElementById("rvSave").textContent = "更新复盘";
      document.getElementById("rvCancel").style.display = "inline-block";
      updateRvCounts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.getElementById("rvProblems").addEventListener("input", updateRvCounts);
    document.getElementById("rvPlan").addEventListener("input", updateRvCounts);
    document.getElementById("rvCancel").addEventListener("click", resetRvForm);
    document.getElementById("rvFilter").addEventListener("change", renderReviews);
    document.getElementById("rhStart") && document.getElementById("rhStart").addEventListener("change", renderReviewHistory);
    document.getElementById("rhEnd") && document.getElementById("rhEnd").addEventListener("change", renderReviewHistory);
    (function initRhTag() { var el = document.getElementById("rhTag"); if (!el) return; el.innerHTML = '<option value="">全部标签</option>' + REVIEW_TAGS.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join(""); el.addEventListener("change", renderReviewHistory); })();
    document.getElementById("rvSave").addEventListener("click", function () {
      var date = document.getElementById("rvDate").value || todayKey();
      var tag = document.getElementById("rvTag").value;
      var p = document.getElementById("rvProblems").value.trim();
      var pl = document.getElementById("rvPlan").value.trim();
      if (!p && !pl) { toast("内容为空，请填写学习问题或改进计划"); return; }
      var list = load("reviews", []);
      var exIdx = -1; for (var i = 0; i < list.length; i++) { if (list[i].date === date) { exIdx = i; break; } }
      if (exIdx >= 0) {
        list[exIdx] = { id: list[exIdx].id, date: date, tag: tag, problems: p, plan: pl, created: list[exIdx].created };
        editingReviewId = list[exIdx].id;
      } else if (editingReviewId) {
        for (var j = 0; j < list.length; j++) { if (list[j].id === editingReviewId) { list[j] = { id: editingReviewId, date: date, tag: tag, problems: p, plan: pl, created: list[j].created }; break; } }
      } else {
        var rec = { id: uid(), date: date, tag: tag, problems: p, plan: pl, created: Date.now() };
        list.push(rec); editingReviewId = rec.id;
      }
      save("reviews", list);
      resetRvForm(); loadTodayReviewIntoForm();
      renderReviews();
      toast("复盘保存成功");
    });

    /* 复盘历史总览（按日期区间/标签筛选 + 标签频次统计 + 点击跳编辑） */
    function renderReviewHistory() {
      var startEl = document.getElementById("rhStart"), endEl = document.getElementById("rhEnd"), tagEl = document.getElementById("rhTag");
      if (!startEl || !tagEl) return;
      var start = startEl.value, end = endEl.value, tag = tagEl.value || "";
      var list = load("reviews", []);
      if (start) list = list.filter(function (r) { return r.date >= start; });
      if (end) list = list.filter(function (r) { return r.date <= end; });
      if (tag) list = list.filter(function (r) { return (r.tag || "其他") === tag; });
      list.sort(function (a, b) { return b.date === a.date ? (b.created || 0) - (a.created || 0) : (b.date < a.date ? -1 : 1); });
      var freq = {}; REVIEW_TAGS.forEach(function (t) { freq[t] = 0; });
      list.forEach(function (r) { var t = r.tag || "其他"; if (freq[t] === undefined) freq[t] = 0; freq[t]++; });
      var maxC = 1; REVIEW_TAGS.forEach(function (t) { if (freq[t] > maxC) maxC = freq[t]; });
      var statsEl = document.getElementById("rhStats");
      if (statsEl) {
        statsEl.innerHTML = '<div class="rh-total">共 ' + list.length + ' 条复盘' + (tag || start || end ? '（已筛选）' : '') + '</div>' +
          REVIEW_TAGS.map(function (t) {
            return '<div class="rh-stat"><span class="rh-stat-name">' + t + '</span><span class="rh-stat-bar"><i style="width:' + Math.round(freq[t] / maxC * 100) + '%"></i></span><span class="rh-stat-num">' + freq[t] + '</span></div>';
          }).join("");
      }
      var box = document.getElementById("rhList"); if (!box) return;
      if (!list.length) { box.innerHTML = '<div class="empty">暂无复盘记录</div>'; return; }
      box.innerHTML = list.map(function (r) {
        var tag2 = r.tag || "其他";
        var preview = ((r.problems || r.plan || "").replace(/\n/g, " ")).slice(0, 42);
        return '<div class="item rvh-item" data-id="' + r.id + '"><div class="item-head"><span class="item-title">' + ICO.calendar + ' ' + r.date + '</span><span class="chip">' + tag2 + '</span>' +
          (preview ? '<span class="rvh-preview">' + esc(preview) + (preview.length >= 42 ? "…" : "") + '</span>' : '') + '</div>' +
          linkageHtml(r.date) +
          '<div class="item-actions"><button class="btn btn-line btn-sm" data-del="' + r.id + '">删除</button></div></div>';
      }).join("");
      box.querySelectorAll(".rvh-item").forEach(function (el) { el.addEventListener("click", function (e) { if (e.target.closest("[data-del]")) return; editReview(el.getAttribute("data-id")); goPage("review"); }); });
      box.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); if (confirm("删除该复盘？")) { save("reviews", load("reviews", []).filter(function (x) { return x.id !== b.getAttribute("data-del"); })); renderReviewHistory(); toast("已删除"); } }); });
      wireReviewLinkage(box);
    }

    /* 试卷专项分析（各模块总题量+答对数；逻辑判断含子项，手动值优先、避免重复统计） */
    var PAPER_MODULES = [
      { key: "politics", name: "政治理论", color: "#c88f8f" },
      { key: "common",   name: "常识判断", color: "#d9a55c" },
      { key: "verbal",   name: "言语理解", color: "#d3a3a3" },
      { key: "logic",    name: "逻辑判断", color: "#b9b3c9", subs: [
        { key: "judge",  name: "判断推理", color: "#a9bed2" },
        { key: "define", name: "定义",     color: "#bcd0de" },
        { key: "analogy",name: "类比",     color: "#c4bcd4" },
        { key: "graph",  name: "图形推理", color: "#a8a0c2" }
      ]},
      { key: "data",     name: "资料分析", color: "#a8c9b4" },
      { key: "quant",    name: "数量关系", color: "#d8bd7a" }
    ];
    var PAPER_MAP = {}; PAPER_MODULES.forEach(function (m) { PAPER_MAP[m.key] = m; });
    function correctOf(mm) { return mm && mm.correct != null ? mm.correct : (mm ? mm.total : 0); }
    function renderPaperRows() {
      var box = document.getElementById("ppRows"), html = "", logicKeys = [];
      PAPER_MODULES.forEach(function (m) {
        if (!m.subs) {
          html += '<div class="paper-row"><span>' + m.name + '</span><input type="number" min="0" id="ppT_' + m.key + '" placeholder="0" /><input type="number" min="0" id="ppC_' + m.key + '" placeholder="0" /><input type="number" min="0" id="ppTime_' + m.key + '" placeholder="0" class="pp-time" /></div>';
        } else {
          logicKeys.push(m.key);
          html += '<div class="paper-row"><span class="lt-head"><span class="lt-caret" data-k="' + m.key + '">▸</span> ' + m.name +
            ' <span class="lt-hint" id="ppAgg_' + m.key + '">合计 0/0</span></span>' +
            '<input type="number" min="0" id="ppT_' + m.key + '" placeholder="0" />' +
            '<input type="number" min="0" id="ppC_' + m.key + '" placeholder="0" /><input type="number" min="0" id="ppTime_' + m.key + '" placeholder="0" class="pp-time" /></div>';
          html += '<div class="paper-subs" id="ppSubs_' + m.key + '" style="display:none;">';
          m.subs.forEach(function (s) {
            html += '<div class="paper-row sub"><span>· ' + s.name + '</span><input type="number" min="0" id="ppT_' + m.key + '_' + s.key + '" placeholder="0" /><input type="number" min="0" id="ppC_' + m.key + '_' + s.key + '" placeholder="0" /><input type="number" min="0" id="ppTime_' + m.key + '_' + s.key + '" placeholder="0" class="pp-time" /></div>';
          });
          html += "</div>";
        }
      });
      box.innerHTML = html;
      // 逻辑判断：展开/收起子项（仅箭头可点，不影响手动输入）
      Array.prototype.forEach.call(box.querySelectorAll(".lt-caret"), function (c) {
        c.addEventListener("click", function (e) {
          e.stopPropagation();
          var mk = c.getAttribute("data-k"), sub = document.getElementById("ppSubs_" + mk);
          var open = sub.style.display === "none";
          sub.style.display = open ? "block" : "none";
          c.textContent = open ? "▾" : "▸";
        });
      });
      // 实时合计：手动值优先，未填则取子项之和（仅显示，避免重复）
      logicKeys.forEach(function (mk) {
        var mod = PAPER_MAP[mk];
        function upd() {
          var mT = +document.getElementById("ppT_" + mk).value || 0, mC = +document.getElementById("ppC_" + mk).value || 0;
          var sT = 0, sC = 0;
          mod.subs.forEach(function (s) { sT += +document.getElementById("ppT_" + mk + "_" + s.key).value || 0; sC += +document.getElementById("ppC_" + mk + "_" + s.key).value || 0; });
          var T = mT > 0 ? mT : sT, C = mT > 0 ? mC : sC;
          var a = document.getElementById("ppAgg_" + mk);
          if (a) { var mismatch = (mT > 0 && sT > 0 && (mT !== sT || mC !== sC)); a.textContent = "合计 " + C + "/" + T + (mismatch ? " ⚠与子项不符" : ""); a.style.color = mismatch ? "var(--danger)" : ""; }
        }
        var ids = ["ppT_" + mk, "ppC_" + mk];
        mod.subs.forEach(function (s) { ids.push("ppT_" + mk + "_" + s.key); ids.push("ppC_" + mk + "_" + s.key); });
        ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener("input", upd); });
        upd();
      });
    }
    var ppPage = 1; var PP_PAGE_SIZE = 8;
    function renderWeakSummary() {
      var el = document.getElementById("weakSummary"); if (!el) return;
      var list = load("papers", []).filter(function (p) { return p.modules; });
      if (!list.length) { el.innerHTML = '<div class="empty">录入套卷后展示薄弱模块</div>'; return; }
      var agg = {};
      list.forEach(function (p) { for (var k in p.modules) { var mm = p.modules[k]; if (!agg[k]) agg[k] = { total: 0, correct: 0 }; agg[k].total += mm.total || 0; agg[k].correct += correctOf(mm); } });
      var items = PAPER_MODULES.map(function (m) {
        var a = agg[m.key]; if (!a || a.total <= 0) return null;
        var rate = a.correct / a.total;
        return { name: m.name, rate: rate, color: rate < 0.6 ? "var(--danger)" : (rate < 0.75 ? "var(--warning)" : "var(--success)") };
      }).filter(function (x) { return x; });
      items.sort(function (a, b) { return a.rate - b.rate; });
      var maxV = 100;
      el.innerHTML = items.map(function (it) {
        var w = (it.rate * 100).toFixed(0);
        return '<div class="weak-row"><span class="weak-name">' + it.name + '</span><span class="weak-track"><span class="weak-fill" style="width:' + w + '%;background:' + it.color + '"></span></span><span class="weak-val">' + w + '%</span></div>';
      }).join("") + '<div style="font-size:12px;color:var(--text-soft);margin-top:4px;">共汇总 ' + list.length + ' 套试卷</div>';
    }
    /* ===== 申论素材库 ===== */
    var ESSAY_CATS = ["政策理论","乡村振兴","基层治理","民生保障","生态文明","经济发展","文化自信","科技自立","其他"];
    var essayCat = "全部"; var essayKw = "";
    function renderEssayTabs() {
      var t = document.getElementById("essayTabs"); if (!t) return;
      var cats = ["全部"].concat(ESSAY_CATS);
      t.innerHTML = cats.map(function (c) { return '<div class="tab' + (essayCat === c ? " active" : "") + '" data-c="' + c + '">' + c + "</div>"; }).join("");
      t.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { essayCat = b.getAttribute("data-c"); renderEssayTabs(); renderEssays(); }); });
    }
    function renderEssays() {
      var box = document.getElementById("essayList"); if (!box) return;
      var list = load("essays", []);
      if (essayCat !== "全部") list = list.filter(function (e) { return e.cat === essayCat; });
      if (essayKw) { var kw = essayKw.toLowerCase(); list = list.filter(function (e) { return (e.title + " " + e.content).toLowerCase().indexOf(kw) >= 0; }); }
      list.sort(function (a, b) { return (b.created || 0) - (a.created || 0); });
      if (!list.length) { box.innerHTML = '<div class="empty">这个分类还没有素材，点「+ 新增素材」积累金句</div>'; return; }
      box.innerHTML = list.map(function (e) {
        return '<div class="item"><div class="item-head"><span class="chip" style="background:var(--accent-soft);color:var(--accent);">' + esc(e.cat) + '</span><span class="item-title">' + esc(e.title) + '</span></div>' +
          '<div class="item-body" style="margin-top:4px;">' + esc(e.content) + '</div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-eedit="' + e.id + '">编辑</button><button class="btn btn-line btn-sm" data-edel="' + e.id + '">删除</button></div></div>';
      }).join("");
      box.querySelectorAll("[data-eedit]").forEach(function (b) { b.addEventListener("click", function () { editEssay(b.getAttribute("data-eedit")); }); });
      box.querySelectorAll("[data-edel]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("删除该素材？")) { save("essays", load("essays", []).filter(function (x) { return x.id !== b.getAttribute("data-edel"); })); renderEssays(); toast("已删除"); } }); });
    }
    function editEssay(id) {
      var list = load("essays", []); var e = id ? list.filter(function (x) { return x.id === id; })[0] : null;
      var isNew = !e; if (isNew) e = { id: uid(), cat: ESSAY_CATS[0], title: "", content: "", created: Date.now() };
      openModal(isNew ? "新增申论素材" : "编辑素材",
        '<div class="form-row"><label>主题分类</label><select id="esCat">' + ESSAY_CATS.map(function (c) { return '<option value="' + c + '"' + (c === e.cat ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select></div>" +
        '<div class="form-row"><label>标题 / 关键词</label><input id="esTitle" value="' + esc(e.title) + '" placeholder="如：新质生产力" /></div>' +
        '<div class="form-row"><label>素材内容 / 金句</label><textarea id="esContent" placeholder="政策要点、论证素材或金句">' + esc(e.content) + "</textarea></div>",
        '<button class="btn btn-primary btn-sm" id="esOk">保存</button>');
      document.getElementById("esOk").addEventListener("click", function () {
        e.cat = document.getElementById("esCat").value;
        e.title = document.getElementById("esTitle").value.trim() || "未命名素材";
        e.content = document.getElementById("esContent").value.trim();
        if (!e.content) { toast("请填写素材内容"); return; }
        var nl = load("essays", []).filter(function (x) { return x.id !== e.id; }); nl.push(e);
        save("essays", nl); closeModal(); renderEssayTabs(); renderEssays(); toast("已保存");
      });
    }
    document.getElementById("addEssayBtn").addEventListener("click", function () { editEssay(null); });
    document.getElementById("essaySearch").addEventListener("input", function () { essayKw = this.value.trim(); renderEssays(); });
    function renderEssay() { renderEssayTabs(); renderEssays(); }

    function renderPapers() {
      document.getElementById("ppDate").value = todayKey();
      renderPaperRows();
      var typeFilter = document.getElementById("ppTypeFilter") ? (document.getElementById("ppTypeFilter").value || "") : "";
      var list = load("papers", []);
      if (typeFilter) list = list.filter(function (p) { return (p.examType || "国考") === typeFilter; });
      list.sort(function (a, b) { return (b.date < a.date ? -1 : 1); });
      var box = document.getElementById("paperList");
      var totalPages = Math.max(1, Math.ceil(list.length / PP_PAGE_SIZE));
      if (ppPage > totalPages) ppPage = totalPages;
      var pageList = list.slice((ppPage - 1) * PP_PAGE_SIZE, ppPage * PP_PAGE_SIZE);
      if (!list.length) { box.innerHTML = '<div class="empty">还没有套卷分析记录</div>'; renderTrend(); renderWeakSummary(); return; }
      box.innerHTML = pageList.map(function (p) {
        var mods = p.modules, total = 0, correct = 0, bars = "";
        if (mods) {
          for (var k in mods) { var mm = mods[k]; total += mm.total || 0; correct += correctOf(mm); }
          var rate = total > 0 ? (correct / total * 100).toFixed(1) : "0.0";
          bars = PAPER_MODULES.map(function (m) {
            var mm = mods[m.key]; if (!mm || mm.total <= 0) return "";
            var isGroup = !!m.subs;
            var cr = mm.total > 0 ? correctOf(mm) / mm.total : 0, weak = cr < 0.6;
            var out = '<div class="bar-row' + (isGroup ? " logic-group" : "") + '" title="' + m.name + '：' + correctOf(mm) + "/" + mm.total + '" + ((mm.time ? " · 用时 " + mm.time + " 分" : ""))><span class="bar-name">' + m.name + (isGroup ? ' <span class="chip">合计</span>' : "") + '</span><div class="bar-track"><div class="bar-fill' + (weak ? " weak" : "") + '" style="width:' + (cr * 100).toFixed(0) + '%"></div></div><span class="bar-val">' + (cr * 100).toFixed(1) + "%" + (weak ? ' <span class="chip weak-tag">薄弱</span>' : "") + "</span></div>";
            if (m.subs && mm.subs) m.subs.forEach(function (s) {
              var sm = mm.subs[s.key]; if (!sm || sm.total <= 0) return;
              var scr = sm.total > 0 ? sm.correct / sm.total : 0, sw = scr < 0.6;
              out += '<div class="bar-row sub" title="' + s.name + '：' + sm.correct + "/" + sm.total + '" + ((sm.time ? " · 用时 " + sm.time + " 分" : ""))><span class="bar-name">· ' + s.name + '</span><div class="bar-track"><div class="bar-fill' + (sw ? " weak" : "") + '" style="width:' + (scr * 100).toFixed(0) + '%"></div></div><span class="bar-val">' + (scr * 100).toFixed(1) + "%" + (sw ? ' <span class="chip weak-tag">薄弱</span>' : "") + "</span></div>";
            });
            return out;
          }).join("");
          var meta = p.date + (p.duration ? " · 时长 " + p.duration + " 分钟" : "") + (p.score !== "" && p.score != null ? " · 分数 " + p.score : "");
          var et = p.examType || "国考";
          return '<div class="item"><div class="item-head"><span class="item-title">' + ICO.scroll + ' ' + esc(p.name) + '</span><span class="exam-tag exam-' + et + '">' + et + '</span><span class="item-meta">' + meta + '</span></div>' +
            '<div class="item-body"><span class="lab">总题量：</span>' + total + ' · <span class="lab">答对数：</span>' + correct + ' · <span class="lab">正确率：</span>' + rate + "%</div>" +
            '<div style="margin-top:10px">' + bars + "</div>" +
            (p.note ? '<div class="item-note"><span class="lab">备注：</span>' + esc(p.note) + "</div>" : "") +
            '<div class="item-actions">' + (hasReview(p.date) ? '<button class="btn btn-ghost btn-sm" data-rvlink="' + p.date + '">查看复盘</button>' : '') + '<button class="btn btn-line btn-sm" data-del="' + p.id + '">删除</button></div></div>';
        }
        return '<div class="item"><div class="item-head"><span class="item-title">' + ICO.scroll + ' ' + esc(p.name) + '</span><span class="exam-tag exam-' + (p.examType || "国考") + '">' + (p.examType || "国考") + '</span><span class="item-meta">' + p.date + '</span></div><div class="item-body">旧版数据（缺少答对数），建议重新录入</div><div class="item-actions"><button class="btn btn-line btn-sm" data-del="' + p.id + '">删除</button></div></div>';
      }).join("");
      box.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("删除该套卷分析？")) { save("papers", load("papers", []).filter(function (x) { return x.id !== b.getAttribute("data-del"); })); renderPapers(); if (document.getElementById("page-overview").classList.contains("active")) renderOverview(); toast("已删除"); } }); });
      box.querySelectorAll("[data-rvlink]").forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); jumpToReviewByDate(b.getAttribute("data-rvlink")); }); });
      var pager = document.getElementById("ppPager");
      if (totalPages <= 1) pager.innerHTML = "";
      else pager.innerHTML = '<button id="ppPrev"' + (ppPage <= 1 ? " disabled" : "") + '>‹ 上一页</button><span class="pager-info">第 ' + ppPage + ' / ' + totalPages + ' 页</span><button id="ppNext"' + (ppPage >= totalPages ? " disabled" : "") + '>下一页 ›</button>';
      var prev = document.getElementById("ppPrev"), next = document.getElementById("ppNext");
      if (prev) prev.addEventListener("click", function () { if (ppPage > 1) { ppPage--; renderPapers(); } });
      if (next) next.addEventListener("click", function () { if (ppPage < totalPages) { ppPage++; renderPapers(); } });
      renderTrend(); renderWeakSummary();
    }
    var trendMetric = "rate";
    function renderTrend() {
      var el = document.getElementById("trendChart"); if (!el) return;
      var list = load("papers", []).filter(function (p) { return p.modules; }).slice();
      list.sort(function (a, b) { return (a.date < b.date ? -1 : 1); });
      function lab(d) { return d && d.length >= 10 ? d.slice(5) : d; }
      if (trendMetric === "rate") {
        if (list.length < 2) { el.innerHTML = '<div class="empty">至少录入 2 套试卷后展示成绩趋势</div>'; return; }
        var pts = list.map(function (p) {
          var t = 0, c = 0; for (var k in p.modules) { var mm = p.modules[k]; t += mm.total || 0; c += correctOf(mm); }
          return { label: lab(p.date), value: t > 0 ? c / t * 100 : 0 };
        });
        drawLine(el, pts, { tip: function (p) { return "正确率 " + p.value.toFixed(1) + "%"; }, color: "#a03a2e" });
      } else {
        var withScore = list.filter(function (p) { return p.score !== "" && p.score != null; });
        if (withScore.length < 2) { el.innerHTML = '<div class="empty">录入分数的试卷不足 2 套，无法展示分数趋势</div>'; return; }
        var pts2 = withScore.map(function (p) { return { label: lab(p.date), value: +p.score }; });
        drawLine(el, pts2, { tip: function (p) { return "分数 " + p.value; }, color: "#4a7c59" });
      }
    }
    document.getElementById("ppSave").addEventListener("click", function () {
      var name = document.getElementById("ppName").value.trim(), date = document.getElementById("ppDate").value || todayKey();
      var duration = Math.max(0, +document.getElementById("ppDuration").value || 0), score = document.getElementById("ppScore").value;
      if (!name) { toast("请填写试卷名称"); return; }
      var modules = {};
      PAPER_MODULES.forEach(function (m) {
        if (!m.subs) {
          var t = +document.getElementById("ppT_" + m.key).value || 0, c = +document.getElementById("ppC_" + m.key).value || 0;
          var tm = +document.getElementById("ppTime_" + m.key).value || 0;
          modules[m.key] = { total: t, correct: Math.min(c, t), time: tm };
        } else {
          var mT = +document.getElementById("ppT_" + m.key).value || 0, mC = +document.getElementById("ppC_" + m.key).value || 0;
          var mTime = +document.getElementById("ppTime_" + m.key).value || 0;
          var T = 0, C = 0, subs = {};
          m.subs.forEach(function (s) {
            var t = +document.getElementById("ppT_" + m.key + "_" + s.key).value || 0, c = +document.getElementById("ppC_" + m.key + "_" + s.key).value || 0;
            var st = +document.getElementById("ppTime_" + m.key + "_" + s.key).value || 0;
            subs[s.key] = { total: t, correct: Math.min(c, t), time: st }; T += t; C += c;
          });
          var finT = mT > 0 ? mT : T, finC = mT > 0 ? mC : C;
          modules[m.key] = { total: finT, correct: Math.min(finC, finT), time: mTime, subs: subs };
        }
      });
      var note = document.getElementById("ppNote").value.trim();
      var examType = document.getElementById("ppType").value || "国考";
      var list = load("papers", []); list.push({ id: uid(), name: name, date: date, duration: duration, score: score, examType: examType, modules: modules, note: note }); save("papers", list);
      document.getElementById("ppName").value = ""; document.getElementById("ppDuration").value = ""; document.getElementById("ppScore").value = ""; document.getElementById("ppNote").value = ""; document.getElementById("ppNoteCount").textContent = "0 / 500";
      renderPaperRows(); renderPapers(); toast("已保存套卷分析");
    });
    document.getElementById("ppNote").addEventListener("input", function () { document.getElementById("ppNoteCount").textContent = this.value.length + " / 500"; });
    Array.prototype.forEach.call(document.querySelectorAll(".trend-btn"), function (b) {
      b.addEventListener("click", function () {
        trendMetric = b.getAttribute("data-metric");
        document.querySelectorAll(".trend-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
        renderTrend();
      });
    });
    document.getElementById("ppTypeFilter").addEventListener("change", function () { ppPage = 1; renderPapers(); });

    /* 侧边栏 / 导航 */
    (function updateDate() { var now = new Date(); document.getElementById("sidebarDate").textContent = now.getFullYear() + "年" + pad(now.getMonth() + 1) + "月" + pad(now.getDate()) + "日 星期" + WK[now.getDay()]; })();
    (function avatarChange() { var avatar = document.getElementById("avatar"), input = document.getElementById("avatarInput");
      var saved = load("avatar", "");
      if (saved) avatar.src = saved;
      avatar.addEventListener("click", function () { input.click(); });
      input.addEventListener("change", function () { var f = input.files && input.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function (e) {
          var img = new Image();
          img.onload = function () {
            var max = 256, w = img.width, h = img.height;
            if (w > max || h > max) { if (w >= h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
            var c = document.createElement("canvas"); c.width = w; c.height = h;
            c.getContext("2d").drawImage(img, 0, 0, w, h);
            var uri = c.toDataURL("image/jpeg", 0.85);
            avatar.src = uri; save("avatar", uri);
          };
          img.onerror = function () { avatar.src = e.target.result; save("avatar", e.target.result); };
          img.src = e.target.result;
        };
        r.readAsDataURL(f);
      }); })();
    /* 数据洞察（零依赖手绘 SVG：环形 / 柱状 / 折线） */
    function renderInsights() {
      var mistakes = load("mistakes", []);
      var mastered = 0; mistakes.forEach(function (m) { if (mm(m) === "mastered") mastered++; });
      var review = mistakes.length - mastered;
      var due = dueReviewCount(mistakes);
      var reviews = load("reviews", []).length;
      var stats = [
        { n: mistakes.length, l: "累计错题" }, { n: mastered, l: "已掌握" }, { n: review, l: "待复习" },
        { n: due, l: "今日待复习" }, { n: reviews, l: "累计复盘" }
      ];
      var sg = document.getElementById("insightStats"); sg.innerHTML = "";
      stats.forEach(function (s) { var d = document.createElement("div"); d.className = "insight-stat"; d.innerHTML = '<span class="is-num">' + s.n + '</span><span class="is-lbl">' + s.l + "</span>"; sg.appendChild(d); });
      drawDonut(document.getElementById("donutMastery"), document.getElementById("donutMasteryLegend"),
        [{ name: "已掌握", value: mastered, color: "#4a7c59" }, { name: "需复习", value: review, color: "#d9a55c" }],
        { center: mistakes.length, centerSub: "错题总数" });
      var modItems = SUBJECTS.map(function (s) { var c = 0; mistakes.forEach(function (m) { if (m.module === s.key) c++; }); return { name: s.name, value: c, color: s.color }; }).filter(function (i) { return i.value > 0; }).sort(function (a, b) { return b.value - a.value; });
      drawBar(document.getElementById("barModule"), modItems);
      var today = new Date(), trend = [];
      for (var i = 29; i >= 0; i--) { var d2 = new Date(today); d2.setDate(d2.getDate() - i); var dk = todayKey(d2); var c = 0; mistakes.forEach(function (m) { if ((m.date || todayKey(new Date(m.created || Date.now()))) === dk) c++; }); trend.push({ label: (d2.getMonth() + 1) + "/" + d2.getDate(), value: c }); }
      drawLine(document.getElementById("lineErrTrend"), trend, { tip: function (p) { return p.value + " 题"; }, color: "#a03a2e" });
      var reasonItems = ERROR_REASONS.map(function (r) { var c = 0; mistakes.forEach(function (m) { if (m.reason === r) c++; }); return { name: r, value: c, color: reasonColor(r) }; }).filter(function (i) { return i.value > 0; }).sort(function (a, b) { return b.value - a.value; });
      drawBar(document.getElementById("barReason"), reasonItems);
    }
    var titles = { overview: "学习概览", "module-overview": "模块学习", timer: "模块学习 / 科目计时器", memo: "模块学习 / 知识备忘录", mistakes: "模块学习 / 分模块错题本", "review-overview": "复盘总结", review: "复盘总结 / 每日学习复盘", "review-history": "复盘总结 / 复盘历史总览", "analysis-overview": "套卷分析", analysis: "套卷分析 / 试卷专项分析", mock: "套卷分析 / 模考提醒", insights: "数据洞察", news: "时政热点", essay: "申论素材" };
    var renderers = { overview: renderOverview, "module-overview": renderModuleOverview, timer: renderTimer, memo: function () { renderMemoTabs(); renderNotes(); }, mistakes: renderMistakes, "review-overview": renderReviewOverview, review: renderReviews, "review-history": renderReviewHistory, "analysis-overview": renderAnalysisOverview, analysis: renderPapers, mock: renderMock, insights: renderInsights, news: renderNews, essay: renderEssay };
    function goPage(id) {
      document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
      var t = document.getElementById("page-" + id); if (t) t.classList.add("active");
      document.querySelectorAll("[data-page]").forEach(function (el) { el.classList.toggle("active", el.getAttribute("data-page") === id); });
      var activeSub = document.querySelector(".submenu-item.active"); if (activeSub) activeSub.closest(".menu-group").classList.add("open");
      document.getElementById("breadcrumb").textContent = titles[id] || "";
      document.body.classList.remove("drawer-open");
      if (renderers[id]) renderers[id]();
    }
    document.querySelectorAll(".menu-item:not(.has-sub)").forEach(function (el) { el.addEventListener("click", function () { goPage(el.getAttribute("data-page")); }); });
    document.querySelectorAll(".submenu-item").forEach(function (el) { el.addEventListener("click", function () { goPage(el.getAttribute("data-page")); }); });
    document.querySelectorAll(".menu-item.has-sub").forEach(function (el) { el.addEventListener("click", function () {
      if (document.body.classList.contains("sidebar-collapsed")) { document.body.classList.remove("sidebar-collapsed"); sidebarCollapsed = false; save("sidebarCollapsed", false); var cb = document.getElementById("collapseBtn"); if (cb) cb.textContent = "«"; }
      el.closest(".menu-group").classList.toggle("open"); var dp = el.getAttribute("data-page"); if (dp) goPage(dp);
    }); });
    document.getElementById("hamburger").addEventListener("click", function () { document.body.classList.toggle("drawer-open"); });
    document.getElementById("overlay").addEventListener("click", function () { document.body.classList.remove("drawer-open"); });

    resetMkForm();
    resetRvForm();
    loadTodayReviewIntoForm();
    seedSampleData();
    /* 挖空关键词：点击切换隐藏/显示，方便自测记忆 */
    document.addEventListener("click", function (e) {
      var kw = e.target.closest(".nc-keyword"); if (!kw) return;
      e.stopPropagation();
      kw.classList.toggle("blind");
    });
    goPage("overview");
    /* 平板横竖屏切换：自动关闭抽屉 */
    window.addEventListener("orientationchange", function () {
      document.body.classList.remove("drawer-open");
      setTimeout(function () { if (window._currentPage && renderers[window._currentPage]) renderers[window._currentPage](); }, 200);
    });
    /* 记录当前页面以便 orientationchange 时重新渲染 */
    var _origGoPage = goPage;
    goPage = function (id) { window._currentPage = id; _origGoPage(id); };

    /* ===== 暗色模式 ===== */
    function applyTheme() {
      var theme = load("theme", "light");
      document.documentElement.setAttribute("data-theme", theme);
      var btn = document.getElementById("themeToggle");
      if (btn) {
        var sun = btn.querySelector(".ico-sun"), moon = btn.querySelector(".ico-moon");
        if (sun) sun.style.display = theme === "dark" ? "" : "none";
        if (moon) moon.style.display = theme === "dark" ? "none" : "";
      }
    }
    function toggleTheme() {
      var cur = load("theme", "light");
      var next = cur === "dark" ? "light" : "dark";
      save("theme", next);
      applyTheme();
    }
    applyTheme();
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);

    /* ===== 侧边栏收起（仅桌面端生效，移动端维持抽屉） ===== */
    var sidebarCollapsed = load("sidebarCollapsed", false);
    function applySidebarCollapse() {
      document.body.classList.toggle("sidebar-collapsed", !!sidebarCollapsed);
      var cb = document.getElementById("collapseBtn");
      if (cb) cb.textContent = sidebarCollapsed ? "»" : "«";
    }
    applySidebarCollapse();
    var collapseBtnEl = document.getElementById("collapseBtn");
    if (collapseBtnEl) collapseBtnEl.addEventListener("click", function () {
      sidebarCollapsed = !sidebarCollapsed; save("sidebarCollapsed", sidebarCollapsed); applySidebarCollapse();
    });

    /* ===== 学习提醒 ===== */
    function checkReminder() {
      var cfg = load("reminder", null);
      if (!cfg || !cfg.enabled) return;
      var now = new Date();
      var today = todayKey(now);
      if (cfg.lastNotified === today) return;
      var hm = cfg.time.split(":");
      var targetH = +hm[0], targetM = +hm[1] || 0;
      if (now.getHours() === targetH && now.getMinutes() === targetM) {
        var due = dueReviewCount(load("mistakes", []));
        var body = "该学习啦！";
        if (due > 0) body += "今日有 " + due + " 题待复习。";
        if (Notification.permission === "granted") {
          new Notification("考公工作台提醒", { body: body, icon: "icon-192.png", badge: "icon-192.png" });
        }
        cfg.lastNotified = today;
        save("reminder", cfg);
      }
    }
    function setupReminder() {
      if (!("Notification" in window)) { toast("此浏览器不支持通知"); return; }
      if (Notification.permission === "granted") {
        openReminderSettings();
        return;
      }
      Notification.requestPermission().then(function(p) {
        if (p === "granted") { toast("通知已开启"); openReminderSettings(); }
        else toast("通知权限被拒绝，请在浏览器设置中手动开启");
      });
    }
    function openReminderSettings() {
      var cfg = load("reminder", { enabled: true, time: "19:00", lastNotified: "" });
      openModal("学习提醒",
        '<div style="display:flex;flex-direction:column;gap:14px;">' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:15px;"><input type="checkbox" id="remEnabled" ' + (cfg.enabled ? "checked" : "") + '> 启用每日提醒</label>' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:15px;">提醒时间: <input type="time" id="remTime" value="' + (cfg.time || "19:00") + '" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border);font-size:14px;"></label>' +
        '<p style="font-size:12px;color:var(--text-soft);">每天指定时间自动弹出学习提醒通知</p>' +
        '</div>',
        '<button class="btn btn-primary" id="remSave">保存</button>'
      );
      document.getElementById("remSave").addEventListener("click", function() {
        var c = {
          enabled: document.getElementById("remEnabled").checked,
          time: document.getElementById("remTime").value || "19:00",
          lastNotified: load("reminder", {}).lastNotified || ""
        };
        save("reminder", c);
        closeModal();
        toast("提醒设置已保存");
      });
    }
    document.getElementById("reminderBtn").addEventListener("click", setupReminder);
    setInterval(checkReminder, 60000);
    checkReminder();

    /* ===== 模考提醒 ===== */
    function renderMock() {
      var cfg = load("mock_reminder", { enabled: true, items: [] });
      var notif = document.getElementById("mockNotifOn"); if (notif) notif.checked = cfg.enabled !== false;
      refreshMockPermUi();
      var list = (cfg.items || []).slice();
      list.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : (a.time < b.time ? -1 : 1)); });
      var box = document.getElementById("mockList"); if (!box) return;
      if (!list.length) { box.innerHTML = '<div class="empty">还没有模考安排，添加一场模考开始倒计时吧</div>'; return; }
      var today = new Date(); today.setHours(0, 0, 0, 0);
      box.innerHTML = list.map(function (m) {
        var t = new Date(m.date + "T00:00:00");
        var diff = Math.round((t - today) / 86400000);
        var dl = diff > 0 ? ("还有 <b>" + diff + "</b> 天") : (diff === 0 ? "<b>就是今天！</b>" : "已过去 <b>" + (-diff) + "</b> 天");
        var past = diff < 0;
        return '<div class="item mock-item' + (past ? " past" : "") + '"><div class="item-head"><span class="item-title">' + ICO.calendar + ' ' + esc(m.name) + '</span><span class="item-meta">' + m.date + (m.time ? " " + m.time : "") + '</span></div>' +
          '<div class="item-body">⏳ ' + dl + (m.note ? ' · ' + esc(m.note) : '') + (m.remindDayBefore !== false ? ' · <span class="chip">考前提醒</span>' : '') + '</div>' +
          '<div class="item-actions"><button class="btn btn-ghost btn-sm" data-med="' + m.id + '">编辑</button><button class="btn btn-line btn-sm" data-mdn="' + m.id + '">删除</button></div></div>';
      }).join("");
      box.querySelectorAll("[data-med]").forEach(function (b) { b.addEventListener("click", function () { editMockExam(b.getAttribute("data-med")); }); });
      box.querySelectorAll("[data-mdn]").forEach(function (b) { b.addEventListener("click", function () { if (confirm("删除该模考安排？")) { var c = load("mock_reminder", { enabled: true, items: [] }); c.items = c.items.filter(function (x) { return x.id !== b.getAttribute("data-mdn"); }); save("mock_reminder", c); renderMock(); toast("已删除"); } }); });
    }
    function editMockExam(id) {
      var cfg = load("mock_reminder", { enabled: true, items: [] });
      var m = id ? cfg.items.filter(function (x) { return x.id === id; })[0] : null;
      var isNew = !m; if (isNew) m = { id: uid(), name: "", date: todayKey(), time: "09:00", note: "", remindDayBefore: true, notified: "" };
      openModal(isNew ? "添加模考" : "编辑模考",
        '<div class="form-row"><label>模考名称</label><input id="mxName" value="' + esc(m.name) + '" placeholder="如：2026国考模考" /></div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;"><div class="form-row" style="flex:1;min-width:120px;margin-bottom:14px;"><label>日期</label><input type="date" id="mxDate" class="mini" value="' + m.date + '" /></div><div class="form-row" style="flex:1;min-width:120px;margin-bottom:14px;"><label>时间</label><input type="time" id="mxTime" class="mini" value="' + (m.time || "09:00") + '" /></div></div>' +
        '<div class="form-row"><label>备注</label><input id="mxNote" value="' + esc(m.note) + '" placeholder="考场 / 科目" /></div>' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink);"><input type="checkbox" id="mxRemind" ' + (m.remindDayBefore !== false ? "checked" : "") + ' /> 考前一天 20:00 提醒</label>',
        '<button class="btn btn-primary btn-sm" id="mxOk">保存</button>');
      document.getElementById("mxOk").addEventListener("click", function () {
        var name = document.getElementById("mxName").value.trim(); if (!name) { toast("请填写模考名称"); return; }
        var date = document.getElementById("mxDate").value; if (!date) { toast("请选择日期"); return; }
        m.name = name; m.date = date; m.time = document.getElementById("mxTime").value || "09:00"; m.note = document.getElementById("mxNote").value.trim(); m.remindDayBefore = document.getElementById("mxRemind").checked;
        var c = load("mock_reminder", { enabled: true, items: [] }); var found = false;
        for (var i = 0; i < c.items.length; i++) { if (c.items[i].id === m.id) { c.items[i] = m; found = true; break; } }
        if (!found) c.items.push(m);
        save("mock_reminder", c); closeModal(); renderMock(); toast("已保存");
      });
    }
    function checkMockReminder() {
      var cfg = load("mock_reminder", null); if (!cfg || !cfg.enabled || !cfg.items || !cfg.items.length) return;
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      var now = new Date(); var today = todayKey(now); var hm = pad(now.getHours()) + ":" + pad(now.getMinutes());
      var changed = false;
      cfg.items.forEach(function (m) {
        if (m.date === today && m.time === hm && m.notified !== today) {
          try { new Notification("模考提醒", { body: "今天的模考「" + m.name + "」" + (m.time || "") + " 开始，加油！", icon: "icon-192.png", badge: "icon-192.png" }); } catch (e) {}
          m.notified = today; changed = true;
        }
        if (m.remindDayBefore !== false) {
          var tm = new Date(m.date + "T00:00:00"); var y = new Date(); y.setHours(0, 0, 0, 0); var diff = Math.round((tm - y) / 86400000);
          if (diff === 1 && hm === "20:00" && m.notified !== "pre-" + today) {
            try { new Notification("模考提醒", { body: "明天「" + m.name + "」" + (m.time || "") + " 开考，记得准备准考证和文具", icon: "icon-192.png", badge: "icon-192.png" }); } catch (e) {}
            m.notified = "pre-" + today; changed = true;
          }
        }
      });
      if (changed) save("mock_reminder", cfg);
    }
    function refreshMockPermUi() {
      var btn = document.getElementById("mockPermBtn"); if (!btn) return;
      var ok = (typeof Notification !== "undefined" && Notification.permission === "granted");
      btn.style.display = ok ? "none" : "";
    }
    document.getElementById("mkExamSave").addEventListener("click", function () {
      var name = document.getElementById("mkName").value.trim(); if (!name) { toast("请填写模考名称"); return; }
      var date = document.getElementById("mkExamDate").value; if (!date) { toast("请选择日期"); return; }
      var cfg = load("mock_reminder", { enabled: true, items: [] });
      cfg.items.push({ id: uid(), name: name, date: date, time: document.getElementById("mkExamTime").value || "09:00", note: document.getElementById("mkExamNote").value.trim(), remindDayBefore: document.getElementById("mkExamRemind").checked, notified: "" });
      save("mock_reminder", cfg);
      document.getElementById("mkName").value = ""; document.getElementById("mkExamNote").value = "";
      renderMock(); toast("已添加模考");
    });
    document.getElementById("mockNotifOn").addEventListener("change", function () { var c = load("mock_reminder", { enabled: true, items: [] }); c.enabled = this.checked; save("mock_reminder", c); toast(this.checked ? "已启用模考通知" : "已关闭模考通知"); });
    var mockPermBtn = document.getElementById("mockPermBtn"), mockTestBtn = document.getElementById("mockTestBtn");
    if (mockPermBtn) mockPermBtn.addEventListener("click", function () {
      if (typeof Notification === "undefined") { toast("此浏览器不支持通知"); return; }
      Notification.requestPermission().then(function (p) { if (p === "granted") toast("通知已开启"); else toast("通知被拒绝"); refreshMockPermUi(); });
    });
    if (mockTestBtn) mockTestBtn.addEventListener("click", function () {
      if (typeof Notification === "undefined") { toast("此浏览器不支持通知"); return; }
      if (Notification.permission !== "granted") { toast("请先开启通知权限"); refreshMockPermUi(); return; }
      try { new Notification("模考提醒测试", { body: "这是一条测试通知，到点会收到模考提醒", icon: "icon-192.png", badge: "icon-192.png" }); } catch (e) {}
    });
    setInterval(checkMockReminder, 60000);
    checkMockReminder();

    /* ===== 数据导出/备份 ===== */
    function exportJSON() {
      var keys = ["daily","checkins","countdowns","mistakes","papers","notes","reviews","timer","ai_cfg","ai_news","news_src","essays","news_fav","news_archive","mock_reminder","profile","theme","reminder","segments"];
      var data = {};
      keys.forEach(function(k) { var v = localStorage.getItem(K + k); if (v) data[k] = JSON.parse(v); });
      data.exportedAt = new Date().toISOString();
      var blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = "kaogong-backup-" + todayKey(new Date()) + ".json"; a.click();
      URL.revokeObjectURL(a.href);
      toast("数据已导出");
    }
    function importJSON() {
      var input = document.createElement("input"); input.type = "file"; input.accept = ".json";
      input.addEventListener("change", function() {
        var file = input.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          try {
            var data = JSON.parse(e.target.result);
            var count = 0;
            Object.keys(data).forEach(function(k) {
              if (k === "exportedAt") return;
              if (data[k] !== undefined && data[k] !== null) {
                localStorage.setItem(K + k, JSON.stringify(data[k]));
                count++;
              }
            });
            toast("已导入 " + count + " 项数据，刷新后生效");
            setTimeout(function() { location.reload(); }, 1500);
          } catch (err) { toast("文件格式错误"); }
        };
        reader.readAsText(file);
      });
      input.click();
    }
    function exportCSV() {
      var mistakes = load("mistakes", []);
      if (!mistakes.length) { toast("暂无错题数据"); return; }
      var header = "科目,日期,题目,错因,正确思路,掌握度";
      var rows = mistakes.map(function(m) {
        var sub = SUB_MAP[m.module]; var mn = sub ? sub.name : m.module;
        return [mn, m.date, '"' + (m.question || "").replace(/"/g,'""') + '"', m.reason || "", '"' + (m.correct || "").replace(/"/g,'""') + '"', m.mastery === "mastered" ? "已掌握" : "未掌握"].join(",");
      });
      var csv = "\uFEFF" + header + "\n" + rows.join("\n");
      var blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = "kaogong-mistakes-" + todayKey(new Date()) + ".csv"; a.click();
      URL.revokeObjectURL(a.href);
      toast("错题 CSV 已导出");
    }
    function openDataManager() {
      var ico = {
        dl: '<svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
        ul: '<svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
        csv: '<svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>',
        del: '<svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
      };
      openModal("数据管理",
        '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<button class="btn btn-primary" id="dmExportJSON">' + ico.dl + '导出全部数据 (JSON)</button>' +
        '<button class="btn" id="dmImportJSON">' + ico.ul + '导入数据 (JSON)</button>' +
        '<button class="btn" id="dmExportCSV">' + ico.csv + '导出错题本 (CSV)</button>' +
        (load("sample_ids", null) ? '<button class="btn" id="dmClearSample"><svg style="width:15px;height:15px;vertical-align:-2px;margin-right:6px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-9 5V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>清空示例数据</button>' : "") +
        '<button class="btn btn-danger" id="dmClear" style="background:var(--danger);color:#fff;">' + ico.del + '清除所有数据</button>' +
        '<p style="font-size:12px;color:var(--text-soft);margin-top:8px;">建议定期导出备份，以防数据丢失</p>' +
        '</div>'
      );
      document.getElementById("dmExportJSON").addEventListener("click", function() { closeModal(); exportJSON(); });
      document.getElementById("dmImportJSON").addEventListener("click", function() { closeModal(); importJSON(); });
      document.getElementById("dmExportCSV").addEventListener("click", function() { closeModal(); exportCSV(); });
      var dmcs = document.getElementById("dmClearSample");
      if (dmcs) dmcs.addEventListener("click", function() {
        if (confirm("确定清空示例数据吗？只删除预置示例，不影响你自己的记录。")) {
          var ok = clearSampleData();
          closeModal(); toast(ok ? "示例数据已清空" : "操作失败");
        }
      });
      document.getElementById("dmClear").addEventListener("click", function() {
        if (confirm("确定要清除所有学习数据吗？此操作不可恢复！建议先导出备份。")) {
          var keys = ["daily","checkins","badges","coins","gachaCount","lastGacha","countdowns","mistakes","papers","notes","reviews","timer","ai_cfg","ai_news","news_src","essays","news_fav","news_archive","mock_reminder","profile","theme","reminder","segments"];
          keys.forEach(function(k) { localStorage.removeItem(K + k); });
          closeModal(); toast("数据已清除"); setTimeout(function() { location.reload(); }, 1000);
        }
      });
    }
    document.getElementById("dataBtn").addEventListener("click", openDataManager);
    /* 首屏快捷备份按钮 + 30 条数据提示 */
    (function initQuickBackup() {
      var qb = document.getElementById("quickBackupBtn");
      if (qb) qb.addEventListener("click", function () { exportJSON(); });
      var tip = document.getElementById("backupTip"), tipBtn = document.getElementById("backupTipBtn");
      if (tipBtn) tipBtn.addEventListener("click", function () { exportJSON(); tip.style.display = "none"; save("backupTipDismissed", todayKey()); });
      function countData() {
        return load("mistakes", []).length + load("papers", []).length + load("notes", []).length +
          load("reviews", []).length + load("essays", []).length + load("countdowns", []).length;
      }
      function maybeShowTip() {
        if (!tip) return;
        var n = countData();
        var c = document.getElementById("backupTipCount"); if (c) c.textContent = n;
        if (n >= 30 && load("backupTipDismissed", "") !== todayKey()) tip.style.display = "flex";
        else tip.style.display = "none";
      }
      window._maybeShowBackupTip = maybeShowTip;
      maybeShowTip();
    })();

    /* ===== 预置示例数据（首次打开展示效果，可一键清空） ===== */
    var SAMPLE_FLAG = "sample_seeded_v1";
    function seedSampleData() {
      if (load(SAMPLE_FLAG, false)) return;
      try {
        var now = new Date();
        var d1 = todayKey(new Date(now.getTime() - 86400000));   /* 昨天 */
        var d3 = todayKey(new Date(now.getTime() - 3 * 86400000)); /* 3 天前 */
        var d20 = todayKey(new Date(now.getTime() - 20 * 86400000)); /* 20 天前 → 逾期 */
        /* 学习时长（昨天 + 前天，供图表展示） */
        var daily = load("daily", {});
        daily[d1] = daily[d1] || {};
        daily[d1]["verbal"] = (daily[d1]["verbal"] || 0) + 5400;
        daily[d1]["data"] = (daily[d1]["data"] || 0) + 3600;
        var d2 = todayKey(new Date(now.getTime() - 2 * 86400000));
        daily[d2] = daily[d2] || {};
        daily[d2]["logic"] = (daily[d2]["logic"] || 0) + 3600;
        save("daily", daily);
        /* 错题：1 条逾期（20 天前）+ 1 条今天到期（昨天录入） */
        var mistakes = load("mistakes", []);
        var m1 = { id: uid(), module: "verbal", date: d20, question: "示例错题：主旨概括题误选干扰项，未抓住转折词后的重点句。", reason: "知识点盲区", correct: "先找转折词（但是/然而），转折后是重点；干扰项常偷换概念。", mastery: "review", reviewBase: d20, difficulty: 2, favorite: false, created: d20 + "T08:00:00" };
        var m2 = { id: uid(), module: "data", date: d1, question: "示例错题：增长率计算把基期量当成现期量。", reason: "公式/方法遗忘", correct: "增长率 = (现期 - 基期) / 基期 × 100%，注意分母是基期。", mastery: "review", reviewBase: d1, difficulty: 1, favorite: false, created: d1 + "T09:00:00" };
        mistakes.push(m1, m2);
        save("mistakes", mistakes);
        /* 复盘（昨天） */
        var reviews = load("reviews", []);
        var rv = { id: uid(), date: d1, tag: "资料分析", problems: "示例复盘：资料分析计算偏慢，增长率概念偶尔混淆。", plan: "明天专项刷 20 道资料分析，限时训练。", created: d1 + "T21:00:00" };
        reviews.push(rv);
        save("reviews", reviews);
        /* 套卷（3 天前） */
        var papers = load("papers", []);
        var pp = { id: uid(), name: "示例套卷：行测模拟卷（一）", date: d3, duration: 120, score: 62, type: "省考", note: "示例数据：言语理解与资料分析是主要失分点。", modules: [
          { module: "verbal", total: 40, correct: 28, time: 32 },
          { module: "data", total: 20, correct: 12, time: 28 },
          { module: "logic", total: 35, correct: 24, time: 30 }
        ], created: d3 + "T10:00:00" };
        papers.push(pp);
        save("papers", papers);
        /* 倒计时（示例国考） */
        var countdowns = load("countdowns", []);
        var cd = { id: uid(), name: "国考（示例）", target: todayKey(new Date(now.getTime() + 90 * 86400000)), color: "#a03a2e" };
        countdowns.push(cd);
        save("countdowns", countdowns);
        /* 记录示例 id，供「清空示例」精准删除 */
        save("sample_ids", { mistakes: [m1.id, m2.id], reviews: rv.id, papers: pp.id, countdowns: cd.id, dailyDays: [d1, d2] });
        save(SAMPLE_FLAG, true);
      } catch (e) {}
    }
    function clearSampleData() {
      try {
        var ids = load("sample_ids", null);
        if (ids) {
          save("mistakes", load("mistakes", []).filter(function (m) { return ids.mistakes.indexOf(m.id) < 0; }));
          save("reviews", load("reviews", []).filter(function (r) { return r.id !== ids.reviews; }));
          save("papers", load("papers", []).filter(function (p) { return p.id !== ids.papers; }));
          save("countdowns", load("countdowns", []).filter(function (c) { return c.id !== ids.countdowns; }));
          var daily = load("daily", {});
          ids.dailyDays.forEach(function (dk) { delete daily[dk]; });
          save("daily", daily);
        }
        save("sample_ids", null);
        save(SAMPLE_FLAG, true);
        return true;
      } catch (e) { return false; }
    }

    /* ===== 隐藏 Splash Screen ===== */
    var splashEl = document.getElementById("splash");
    if (splashEl) { splashEl.style.opacity = "0"; setTimeout(function() { splashEl.remove(); }, 400); }

    /* 暴露给调试 / 外部调用 */
    window.goPage = goPage; window.todayKey = todayKey;
  })();
  