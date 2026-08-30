#!/usr/bin/env node
/**
 * 时政聚合脚本（服务端运行，由 GitHub Actions 每小时触发）
 * 抓取多源 -> 考点标注 -> 输出仓库根目录 news-data.json
 * 前端直接读取该静态 JSON，实现「多源实时时政」而无需运行时服务器。
 *
 * 数据源：
 *   1. 中国新闻网 RSS（新闻，含原文链接）
 *   2. 百度热搜（热搜维度，含搜索原文链接）
 * 说明：微博热搜官方接口需登录(cookie)返回 403；学习强国/云岭先锋无公开接口，
 *      故以百度热搜替代「热搜」维度。如需更多源，在下方 SOURCES 中扩展即可。
 */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const OUT = path.join(__dirname, '..', 'news-data.json');
const MAX_ITEMS = 24;

/* ---------- 网络 ---------- */
function fetchText(url, headers, timeoutMs) {
  return new Promise(function (resolve, reject) {
    var req = https.get(url, {
      timeout: timeoutMs || 10000,
      headers: Object.assign({ 'User-Agent': UA, 'Accept': '*/*' }, headers || {})
    }, function (r) {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        // 跟随一次重定向
        return fetchText(r.headers.location, headers, timeoutMs).then(resolve, reject);
      }
      var d = '';
      r.setEncoding('utf8');
      r.on('data', function (c) { d += c; });
      r.on('end', function () { resolve(d); });
    });
    req.on('timeout', function () { req.destroy(); reject(new Error('timeout')); });
    req.on('error', function (e) { reject(e); });
  });
}

/* ---------- 文本处理 ---------- */
function decodeEntities(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); })
    .replace(/&amp;/g, '&').trim();
}
function todayKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function hhmm() {
  var d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/* ---------- 考点标注（与前端 examTags / classifyNews / newsScore 保持一致） ---------- */
function examTags(title) {
  var t = (title || '').toLowerCase();
  var out = [];
  if (/公务员|国考|国家公务员|行测|申论|常识判断|职位表|报名条件|笔试|面试/.test(t)) out.push('国考');
  if (/省考|联考|乡镇公务员|选调生|市考|本省/.test(t)) out.push('省考');
  if (/事业单位|教师招聘|三支一扶|军队文职|社区工作者|国企|卫健/.test(t)) out.push('事业单位');
  if (!out.length) out.push('申论素材');
  return out;
}
function classifyNews(text) {
  var t = (text || '').toLowerCase();
  if (/外交|国际|联合国|美国|俄|欧盟|日韩|中东|北约|制裁|冲突|峰会|访华|一带一路|中亚/.test(t)) return 'international';
  if (/政策|国务院|发改委|人大|政协|两会|三中|中央|改革|立法|修订|条例|公务员|编制|招录|考试|申论|行测|公告|印发|部署|会议|决议/.test(t)) return 'policy';
  if (/经济|gdp|增速|通胀|贸易|产业|投资|金融|货币|利率|就业|收入|消费|税收|财政|贷款|市场/.test(t)) return 'economy';
  if (/科技|ai|人工智能|芯片|半导体|航天|卫星|量子|新能源|数字化|创新|数据/.test(t)) return 'tech';
  if (/社会|民生|养老|医疗|教育|住房|环保|碳|污染|食品安全|交通|人口|乡村振兴|农业农村|兜底/.test(t)) return 'society';
  return 'hot';
}
function newsScore(text) {
  var t = (text || '').toLowerCase();
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

/* ---------- 各源抓取 ---------- */
async function fetchChinanews() {
  var xml = await fetchText('https://www.chinanews.com.cn/rss/scroll-news.xml', {});
  var out = [];
  var re = /<item>([\s\S]*?)<\/item>/g, m;
  while ((m = re.exec(xml))) {
    var b = m[1];
    var title = (b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    var link = (b.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    if (!title) continue;
    out.push({ title: decodeEntities(title), url: link, source: '中国新闻网' });
  }
  return out;
}
async function fetchBaiduHot() {
  var html = await fetchText('https://top.baidu.com/board?tab=realtime', { Referer: 'https://www.baidu.com/' });
  var out = [];
  var re = /"query":"([^"]+)","rawUrl":"([^"]+)"/g, m;
  while ((m = re.exec(html))) {
    out.push({ title: decodeEntities(m[1]), url: m[2], source: '百度热搜' });
  }
  return out;
}

/* ---------- 主流程 ---------- */
(async function () {
  var collected = [];
  var sourceNames = [];
  var tasks = [
    { name: '中国新闻网', fn: fetchChinanews },
    { name: '百度热搜', fn: fetchBaiduHot }
  ];
  for (var i = 0; i < tasks.length; i++) {
    try {
      var items = await tasks[i].fn();
      if (items.length) { collected = collected.concat(items); sourceNames.push(tasks[i].name + '(' + items.length + ')'); }
      console.log('[ok] ' + tasks[i].name + ': ' + items.length + ' 条');
    } catch (e) {
      console.log('[fail] ' + tasks[i].name + ': ' + e.message);
    }
  }

  if (!collected.length) {
    console.log('所有源均失败，跳过写入（前端将回退 RSS / 内置要点）');
    process.exit(0);
  }

  // 去重 + 标注 + 排序
  var seen = {}, items = [];
  collected.forEach(function (it) {
    var key = (it.title || '').slice(0, 40);
    if (!key || seen[key]) return;
    seen[key] = 1;
    items.push({
      title: it.title,
      url: it.url || '',
      source: it.source || '',
      cat: classifyNews(it.title),
      score: newsScore(it.title),
      exams: examTags(it.title)
    });
  });
  // 新闻（score>=1）优先，其次按热度/相关度
  items.sort(function (a, b) { return b.score - a.score; });
  var top = items.slice(0, MAX_ITEMS);

  var data = {
    date: todayKey(),
    time: hhmm(),
    generatedAt: new Date().toISOString(),
    source_summary: sourceNames.join(' · '),
    count: top.length,
    items: top
  };
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log('已写入 ' + top.length + ' 条 -> ' + path.relative(process.cwd(), OUT));
  console.log('来源: ' + data.source_summary);
})();
