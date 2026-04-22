// ===== 状态管理 =====
let S={done:{},act:{},adj:[],undo:[]};
let autoExpandDay=null;
function load(){try{const s=localStorage.getItem('tp');if(s)S=JSON.parse(s)}catch(e){}}
function save(){try{localStorage.setItem('tp',JSON.stringify(S))}catch(e){}}

// ===== 工具函数 =====
function fm(m){m=Math.max(0,Math.min(1440,m));return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function fd(s,e){const d=e-s;if(d<60)return d+'min';const h=Math.floor(d/60),m=d%60;return m?h+'h'+m+'min':h+'h'}
function gp(m){return((m/60-GS)/GH*100)}
function nm(){const n=new Date();return n.getHours()*60+n.getMinutes()}
// 旅行日期
const TD=['2026-04-28','2026-04-29','2026-04-30','2026-05-01','2026-05-02','2026-05-03','2026-05-04','2026-05-05'];
function todayStr(){return new Date().toISOString().slice(0,10)}
function isTravelDay(d){return TD[d-1]===todayStr()}
function todayDayIdx(){const t=todayStr();const i=TD.indexOf(t);return i>=0?i+1:0}

// 意外预案
const EMERGENCIES=[
{t:'花山游船因水位取消',a:'直接去靖西，时间更宽裕，路上找好吃的'},
{t:'4.30宁明→靖西高速堵车',a:'导航切国道，或服务区休息等1h再走'},
{t:'5.2深圳北换乘来不及',a:'改签下一班，不要跑！安全第一'},
{t:'5.3风车岛天气不好/大风',a:'转去汕尾市区逛街吃饭，一样开心'},
{t:'5.4红海湾回惠州堵车',a:'提前出发，走国道备选，实时看导航路况'},
{t:'女儿生病',a:'退烧药先稳住体温，就近医院，行程可全砍'},
{t:'下雨',a:'小雨照玩穿雨衣，大雨缩短行程，暴雨不开山路'},
];

// ===== Tab切换 =====
function swTab(t){
  const cur=document.querySelector('.ni.act');
  if(cur&&cur.dataset.t===t)return;
  document.querySelectorAll('[id^="tab-"]').forEach(e=>e.classList.add('hidden'));
  document.getElementById('tab-'+t).classList.remove('hidden');
  document.querySelectorAll('.ni').forEach(b=>{b.classList.toggle('act',b.dataset.t===t);b.classList.toggle('text-gray-500',b.dataset.t!==t)});
  if(t==='overview')renderOverview();if(t==='daily')renderDaily();if(t==='guide')renderGuide();if(t==='packing')renderPacking();
}
function scrollToDay(d){setTimeout(()=>{const el=document.getElementById('day-'+d);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})},100)}
function goToDay(d){autoExpandDay=d;swTab('daily');setTimeout(()=>scrollToDay(d),100)}

// ===== 渲染总览 =====
function renderOverview(){
  const el=document.getElementById('tab-overview');
  let h=`<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
    <div class="bg-white rounded-xl p-4 shadow-sm text-center relative overflow-hidden"><div class="absolute right-1 bottom-0 text-4xl opacity-[0.06] select-none pointer-events-none">📅</div><div class="text-2xl font-bold text-teal-600">8</div><div class="text-xs text-gray-500">总天数</div></div>
    <div class="bg-white rounded-xl p-4 shadow-sm text-center relative overflow-hidden"><div class="absolute right-1 bottom-0 text-4xl opacity-[0.06] select-none pointer-events-none">🚄</div><div class="text-2xl font-bold text-blue-600">6</div><div class="text-xs text-gray-500">高铁程</div></div>
    <div class="bg-white rounded-xl p-4 shadow-sm text-center relative overflow-hidden"><div class="absolute right-1 bottom-0 text-4xl opacity-[0.06] select-none pointer-events-none">🏞️</div><div class="text-2xl font-bold text-emerald-600">7</div><div class="text-xs text-gray-500">景区</div></div>
    <div class="bg-white rounded-xl p-4 shadow-sm text-center relative overflow-hidden"><div class="absolute right-1 bottom-0 text-4xl opacity-[0.06] select-none pointer-events-none">🏨</div><div class="text-2xl font-bold text-purple-600">5</div><div class="text-xs text-gray-500">换酒店</div></div>
  </div>`;
  h+=`<div class="bg-white rounded-xl shadow-sm p-4 mb-6"><h2 class="text-base font-bold text-gray-800 mb-3">📊 时间线一览</h2><div class="flex flex-wrap gap-2 mb-3"><span class="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1 font-medium">🌊 4.29 德天瀑布 <strong>10:00入园</strong></span><span class="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-1 font-medium">🏔️ 4.30 花山岩画 <strong>10:30上船</strong></span></div><div class="gw"><div class="gi">`;
  h+=`<div class="flex items-center gap-2 mb-1"><div class="w-14 flex-shrink-0"></div><div class="gr flex-1" style="height:18px;background:transparent">`;
  for(let hr=GS;hr<=GE;hr+=3)h+=`<span style="position:absolute;left:${gp(hr*60)}%;transform:translateX(-50%);top:0" class="text-xs text-gray-400">${hr}:00</span>`;
  h+=`<span style="position:absolute;left:${gp(420)}%;transform:translateX(-50%);top:0" class="text-xs text-teal-500 font-medium">7:00</span>`;
  h+=`</div><div class="w-10 flex-shrink-0"></div></div>`;
  DI.forEach(di=>{
    const sg=IT.filter(s=>s.d===di.d),dn=sg.filter(s=>S.done[s.id]).length;
    const pct=sg.length?Math.round(dn/sg.length*100):0;
    h+=`<div class="flex items-center gap-2 mb-1.5 cursor-pointer" onclick="goToDay(${di.d})"><div class="w-14 text-xs font-medium text-gray-600 flex-shrink-0">${di.dt}<br><span class="text-gray-400">${di.wk}</span></div><div class="gr flex-1">`;
    for(let hr=GS;hr<=GE;hr+=3)h+=`<div class="gm" style="left:${gp(hr*60)}%"></div>`;
    h+=`<div class="gm" style="left:${gp(420)}%;background:#14b8a6"></div>`;
    sg.forEach(seg=>{
      const sp=gp(seg.s),ep=gp(seg.e),w=Math.max(ep-sp,0.5);
      const op=S.done[seg.id]?'opacity-40':'';
      const label=w>=2.5?seg.t.replace(/^\S+\s/,''):'';
      h+=`<div class="gs ${op}" style="left:${sp}%;width:${w}%;background:${TC[seg.tp]}" title="${seg.t}(${fm(seg.s)}-${fm(seg.e)})">${label}</div>`;
    });
    h+=`</div><div class="w-10 text-xs text-right ${pct===100?'text-emerald-500 font-bold':'text-gray-400'}">${pct}%</div></div>`;
  });
  h+=`</div></div><div class="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">`;
  Object.entries(TC).forEach(([k,v])=>{
    if(k==='other')return;
    const lb={train:'高铁',drive:'自驾',attraction:'景区',meal:'餐饮',hotel:'酒店',rest:'休息'}[k]||k;
    h+=`<span class="flex items-center gap-1 text-xs text-gray-600"><span class="w-3 h-3 rounded-sm" style="background:${v}"></span>${lb}</span>`;
  });
  h+='</div></div>';
  const route=[
    {p:'深圳北',d:'4.28',c:'bg-blue-50 text-blue-700',dot:'bg-blue-500'},
    {p:'南宁东',d:'4.28',c:'bg-teal-50 text-teal-700',dot:'bg-teal-500'},
    {p:'崇左南',d:'4.28',c:'bg-teal-50 text-teal-700',dot:'bg-teal-500'},
    {p:'大新',d:'4.28-29',c:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
    {p:'宁明',d:'4.30',c:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
    {p:'靖西',d:'4.30-5.1',c:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
    {p:'南宁',d:'5.1-2',c:'bg-teal-50 text-teal-700',dot:'bg-teal-500'},
    {p:'深圳北',d:'5.2',c:'bg-blue-50 text-blue-700',dot:'bg-blue-500'},
    {p:'仲恺',d:'5.2',c:'bg-teal-50 text-teal-700',dot:'bg-teal-500'},
    {p:'惠州',d:'5.2-3',c:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
    {p:'汕尾',d:'5.3-4',c:'bg-sky-50 text-sky-700',dot:'bg-sky-500'},
    {p:'僮侨公园',d:'5.4',c:'bg-emerald-50 text-emerald-700',dot:'bg-emerald-500'},
    {p:'惠州北',d:'5.4',c:'bg-blue-50 text-blue-700',dot:'bg-blue-500'},
    {p:'深圳',d:'5.4-5',c:'bg-slate-50 text-slate-700',dot:'bg-slate-500'}
  ];
  h+=`<div class="bg-white rounded-xl shadow-sm p-4 mb-6"><h2 class="text-base font-bold text-gray-800 mb-4">🗺️ 行程路线</h2><div class="overflow-x-auto"><div class="flex items-center gap-1 min-w-max px-1">`;
  route.forEach((r,i)=>{
    if(i>0)h+=`<div class="flex flex-col items-center mx-1"><div class="w-6 h-px bg-gray-300 mb-1"></div><div class="text-[10px] text-gray-300">→</div></div>`;
    h+=`<div class="flex flex-col items-center gap-1">`;
    h+=`<span class="${r.c} px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap">${r.p}</span>`;
    h+=`<span class="text-[10px] text-gray-400">${r.d}</span>`;
    h+=`<div class="w-2 h-2 rounded-full ${r.dot}"></div>`;
    h+=`</div>`;
  });
  h+=`</div></div></div>`;
  h+='<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';
  DI.forEach(di=>{
    const sg=IT.filter(s=>s.d===di.d),dn=sg.filter(s=>S.done[s.id]).length;
    const pct=sg.length?Math.round(dn/sg.length*100):0;
    const dr=sg.filter(s=>s.tp==='drive').reduce((a,s)=>a+(s.e-s.s),0);
    const at=sg.filter(s=>s.tp==='attraction').reduce((a,s)=>a+(s.e-s.s),0);
    h+=`<div class="bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition" onclick="goToDay(${di.d})">
      <div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="text-xl">${di.em}</span><div><div class="font-bold text-gray-800 text-sm">Day${di.d}·${di.dt}</div><div class="text-xs text-gray-500">${di.wk}·${di.t}</div></div></div><div class="text-xs font-medium ${pct===100?'text-emerald-500':'text-teal-600'}">${pct}%</div></div>
      <div class="w-full bg-gray-100 rounded-full h-1.5 mb-2"><div class="h-1.5 rounded-full ${pct===100?'bg-emerald-500':'bg-teal-500'}" style="width:${pct}%"></div></div>
      <div class="flex gap-3 text-xs text-gray-500">${dr?'<span>🚗'+fd(0,dr)+'</span>':''}${at?'<span>🏞️'+fd(0,at)+'</span>':''}<span>${sg.length}项</span></div></div>`;
  });
  h+='</div>';
  el.innerHTML=h;
}

// ===== 渲染每日行程 =====
function renderDaily(){
  const el=document.getElementById('tab-daily');
  const todayD=todayDayIdx();
  const expanded=new Set();
  DI.forEach(di=>{
    const body=document.getElementById('day-body-'+di.d);
    if(body&&!body.classList.contains('hidden'))expanded.add(di.d);
  });
  let h='';
  DI.forEach(di=>{
    const sg=IT.filter(s=>s.d===di.d),dn=sg.filter(s=>S.done[s.id]).length;
    const pct=sg.length?Math.round(dn/sg.length*100):0;
    const isToday=di.d===todayD;
    const isExpanded=autoExpandDay===di.d||expanded.has(di.d);
    h+=`<div id="day-${di.d}" class="bg-white rounded-xl shadow-sm overflow-hidden mb-6 ${isToday?'ring-2 ring-amber-400 ring-offset-1':''}">
      <div class="bg-gradient-to-r ${di.cl} p-4 text-white cursor-pointer select-none" onclick="toggleDayBody(${di.d})">
        <div class="flex items-center justify-between"><div class="flex items-center gap-2"><div><div class="font-bold text-lg">Day${di.d}·${di.dt} ${di.wk}</div><div class="text-white/80 text-sm">${di.em} ${di.t}</div></div>${isToday?'<span class="bg-white/25 rounded-full px-2 py-0.5 text-xs font-bold animate-pulse">📍今天</span>':''}</div><div class="text-right"><div class="text-2xl font-bold">${pct}%</div><div class="text-white/70 text-xs">${dn}/${sg.length}</div></div></div>
        <div class="w-full bg-white/20 rounded-full h-1.5 mt-2"><div class="h-1.5 rounded-full bg-white" style="width:${pct}%"></div></div>
      </div><div class="p-3 sm:p-4 transition-all duration-300 ${isExpanded?'':'hidden'}" id="day-body-${di.d}">`;
    sg.forEach(seg=>{
      const done=!!S.done[seg.id];
      const dev=S.act[seg.id]?(S.act[seg.id]-seg.e):0;
      const devStr=dev>0?`+${dev}min`:(dev<0?`${dev}min`:'');
      const devCls=dev>0?'text-red-500':dev<0?'text-emerald-500':'';
      const bgc=TBG[seg.tp]||'bg-gray-50';
      const adj=S.adj.find(a=>a.segId===seg.id);
      const adjStr=adj?`<span class="text-xs text-teal-600 ml-1">⏰已调整${adj.delta>0?'+':''}${adj.delta}min</span>`:'';
      const fixedTag=seg.fx?'<span class="ml-1 text-xs bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-medium">🔒 固定</span>':'';
      const actTime=S.act[seg.id]?`<span class="text-xs ${devCls} ml-1">实际${fm(S.act[seg.id])}(${devStr})</span>`:'';
      const warnHtml=seg.warn?`<div class="mt-1.5 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-2 text-xs text-amber-700 font-medium">⚠️ ${seg.warn}</div>`:'';
      h+=`<div class="sc ${bgc} ${done?'done':''}" id="card-${seg.id}" style="border-left-color:${TC[seg.tp]}">
        <div class="flex items-start gap-3">
          <div class="ck ${done?'on':''}" onclick="toggleSeg('${seg.id}')">${done?'✓':''}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center flex-wrap gap-1"><span class="st font-medium text-gray-800 text-sm">${seg.t}</span>${fixedTag}${adjStr}</div>
            ${seg.sub?`<div class="text-xs text-gray-500 mt-0.5">${seg.sub}</div>`:''}
            <div class="flex items-center flex-wrap gap-2 mt-1"><span class="text-xs text-gray-500">🕐 ${fm(seg.s)} - ${fm(seg.e)}</span><span class="text-xs text-gray-400">(${fd(seg.s,seg.e)})</span>${actTime}</div>
            ${warnHtml}
            ${seg.tips&&seg.tips.length?`<div class="mt-1.5 cursor-pointer select-none" onclick="this.nextElementSibling.classList.toggle('open')"><span class="text-xs text-teal-600 hover:text-teal-700">💡 提示 ▾</span></div><div class="tc"><div class="mt-1 space-y-0.5">${seg.tips.map(t=>`<div class="text-xs text-gray-500">• ${t}</div>`).join('')}</div></div>`:''}
          </div>
        </div>
      </div>`;
    });
    h+='</div></div>';
  });
  el.innerHTML=h;
  autoExpandDay=null;
  updateUndoBtn();
}
function toggleDayBody(d){
  const el=document.getElementById('day-body-'+d);
  if(el)el.classList.toggle('hidden');
}

// ===== 勾选逻辑 =====
function toggleSeg(id){
  const seg=IT.find(s=>s.id===id);
  if(!seg)return;
  // 取消勾选
  if(S.done[id]){
    // 撤销该段的调整
    const relAdj=S.adj.filter(a=>a.segId===id);
    if(relAdj.length>0){
      S.undo.push({done:{...S.done},act:{...S.act},adj:JSON.parse(JSON.stringify(S.adj))});
      relAdj.forEach(a=>{const s=IT.find(x=>x.id===a.segId);if(s){s.s=a.from.s;s.e=a.from.e}});
      S.adj=S.adj.filter(a=>a.segId!==id);
    }
    delete S.done[id];delete S.act[id];
    save();renderDaily();renderOverview();return;
  }
  // 弹出时间选择器
  showTimePickerModal(seg);
}

// ===== 时间选择器弹窗 =====
function showTimePickerModal(seg){
  // 默认时间：旅行当天用当前时间，非旅行天用计划结束时间
  const defaultTime=isTravelDay(seg.d)?nm():seg.e;
  const defaultStr=fm(defaultTime);
  const plannedStr=fm(seg.e);
  const dayInfo=DI.find(d=>d.d===seg.d);

  let h=`<div class="text-center mb-4"><div class="text-4xl mb-2">✅</div>
    <h3 class="font-bold text-gray-800 text-lg">完成确认</h3></div>
    <div class="bg-gray-50 rounded-lg p-3 mb-4">
      <div class="text-sm text-gray-600 mb-1"><strong>${seg.ic} ${seg.t}</strong></div>
      <div class="text-sm text-gray-500">计划时间: ${fm(seg.s)} - ${plannedStr} (${fd(seg.s,seg.e)})</div>
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">实际完成时间</label>
      <div class="flex items-center gap-3">
        <input type="time" id="actual-time-input" value="${defaultStr}" 
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-lg font-medium text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none" />
        <div class="text-xs text-gray-400 text-right leading-relaxed">
          计划: <strong>${plannedStr}</strong><br>
          ${isTravelDay(seg.d)?'<span class="text-teal-600">📅 旅行当天</span>':'<span class="text-gray-400">非旅行日</span>'}
        </div>
      </div>
    </div>
    <div id="time-deviation-preview" class="hidden bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
      <div class="text-sm text-amber-700" id="deviation-text"></div>
    </div>
    <div class="flex gap-3">
      <button class="flex-1 bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-700" onclick="confirmSegComplete('${seg.id}')">确认完成</button>
      <button class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200" onclick="closeModal()">取消</button>
    </div>`;

  document.getElementById('modal-body').innerHTML=h;
  document.getElementById('modal').classList.remove('hidden');

  // 监听时间变化，实时预览偏差
  const input=document.getElementById('actual-time-input');
  if(input){
    input.addEventListener('input',function(){
      const [hh,mm]=this.value.split(':').map(Number);
      if(isNaN(hh)||isNaN(mm))return;
      const actual=hh*60+mm;
      const dev=actual-seg.e;
      const preview=document.getElementById('time-deviation-preview');
      const text=document.getElementById('deviation-text');
      if(Math.abs(dev)>=5){
        preview.classList.remove('hidden');
        const devStr=dev>0?`迟到${dev}分钟`:`提前${-dev}分钟`;
        const devCls=dev>0?'text-red-600':'text-emerald-600';
        let scope='';
        if(Math.abs(dev)<15)scope='仅影响下一项行程';
        else if(Math.abs(dev)<60)scope=`将影响当天后续${IT.filter(s=>s.d===seg.d&&s.s>=seg.e&&!s.fx&&!S.done[s.id]).length}项行程`;
        else scope='⚠️ 偏差较大，将影响当天所有后续行程';
        text.innerHTML=`<span class="${devCls} font-medium">${devStr}</span> · ${scope}`;
      }else{
        preview.classList.add('hidden');
      }
    });
    // 触发一次初始预览
    input.dispatchEvent(new Event('input'));
  }
}

// 确认完成
function confirmSegComplete(segId){
  const seg=IT.find(s=>s.id===segId);if(!seg)return;
  const input=document.getElementById('actual-time-input');
  if(!input)return;
  const [hh,mm]=input.value.split(':').map(Number);
  if(isNaN(hh)||isNaN(mm)){showToast('⚠️ 请输入有效时间',2000);return}
  const actual=hh*60+mm;
  const dev=actual-seg.e;

  S.done[segId]=true;
  S.act[segId]=actual;
  save();
  closeModal();
  renderDaily();
  renderOverview();

  // 根据偏差大小决定调整范围
  if(Math.abs(dev)<5||seg.fx)return; // 偏差<5分钟或固定时间，不调整
  if(Math.abs(dev)<15){
    // 小偏差：只调整下一项
    showAdjustModal(seg,dev,'next');
  }else{
    // 大偏差：调整所有受影响的
    showAdjustModal(seg,dev,'all');
  }
}

// ===== 偏差调整弹窗 =====
function showAdjustModal(seg,dev,scope){
  const devStr=dev>0?`迟到${dev}分钟`:`提前${-dev}分钟`;
  const devCls=dev>0?'text-red-600':'text-emerald-600';
  const allAffected=IT.filter(s=>s.d===seg.d&&s.s>=seg.e&&!s.fx&&!S.done[s.id]);
  // 小偏差只取下一项，大偏差取全部
  const affected=scope==='next'?(allAffected.length>0?[allAffected[0]]:[]):allAffected;
  const scopeLabel=scope==='next'?'仅调整下一项':'调整所有受影响行程';

  let h=`<div class="text-center mb-4"><div class="text-4xl mb-2">${dev>0?'⏰':'⚡'}</div><h3 class="font-bold text-gray-800 text-lg">时间偏差提醒</h3></div>
    <div class="bg-gray-50 rounded-lg p-3 mb-4">
      <div class="text-sm text-gray-600 mb-1"><strong>${seg.t}</strong></div>
      <div class="text-sm">计划完成: <strong>${fm(seg.e)}</strong> → 实际: <strong>${fm(S.act[seg.id])}</strong></div>
      <div class="text-sm mt-1 ${devCls} font-medium">${devStr}</div>
    </div>`;

  if(affected.length>0){
    h+=`<div class="mb-4"><div class="text-sm font-medium text-gray-700 mb-2">${scopeLabel}（${affected.length}项）：</div><div class="space-y-1 max-h-48 overflow-y-auto">`;
    affected.forEach(s=>{const ns=s.s+dev,ne=s.e+dev;
      h+=`<div class="text-xs text-gray-600 flex items-center gap-2"><span>${s.ic}</span><span class="flex-1">${s.t}</span><span class="text-gray-400">${fm(s.s)}-${fm(s.e)}</span><span class="text-teal-600">→</span><span class="text-teal-700 font-medium">${fm(ns)}-${fm(ne)}</span></div>`});
    h+='</div></div>';
  }

  // 冲突检查
  const fixedAfter=IT.filter(s=>s.d===seg.d&&s.fx&&s.s>seg.s);
  let conflict=false;
  if(fixedAfter.length>0&&affected.length>0){
    const newEnd=affected[affected.length-1].e+dev;
    fixedAfter.forEach(fs=>{if(newEnd>fs.s)conflict=true});
    if(conflict)h+=`<div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><div class="text-sm text-red-700 font-medium">⚠️ 调整后可能与固定行程（高铁）冲突！</div><div class="text-xs text-red-600 mt-1">建议手动检查或跳过部分行程。</div></div>`;
  }

  // 小偏差时多给一个"调整所有"选项
  const expandBtn=scope==='next'&&allAffected.length>1?`<button class="w-full bg-gray-50 text-gray-600 rounded-lg py-2 text-xs font-medium hover:bg-gray-100 mt-2" onclick="showAdjustModal(IT.find(s=>s.id==='${seg.id}'),${dev},'all')">🔄 偏差较大？调整所有${allAffected.length}项受影响行程</button>`:'';

  h+=`<div class="flex gap-3">
    <button class="flex-1 bg-teal-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-700 ${conflict?'opacity-50':''}" onclick="doAdjust('${seg.id}',${dev},'${scope}')" ${conflict?'disabled':''}>${conflict?'存在冲突':'确认调整'}</button>
    <button class="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200" onclick="closeModal()">保持原计划</button>
  </div>${expandBtn}`;

  document.getElementById('modal-body').innerHTML=h;
  document.getElementById('modal').classList.remove('hidden');
}

function doAdjust(segId,dev,scope){
  const seg=IT.find(s=>s.id===segId);if(!seg)return;
  S.undo.push({done:{...S.done},act:{...S.act},adj:JSON.parse(JSON.stringify(S.adj))});
  const allAffected=IT.filter(s=>s.d===seg.d&&s.s>=seg.e&&!s.fx&&!S.done[s.id]);
  const affected=scope==='next'?(allAffected.length>0?[allAffected[0]]:[]):allAffected;
  affected.forEach(s=>{s.s+=dev;s.e+=dev;S.adj.push({segId:s.id,delta:dev,from:{s:s.s-dev,e:s.e-dev},to:{s:s.s,e:s.e}})});
  save();closeModal();renderDaily();renderOverview();
  showToast(`✅ 已调整${affected.length}项行程(${dev>0?'+':''}${dev}min)，可点撤回还原`,3000);
}

function closeModal(){document.getElementById('modal').classList.add('hidden')}

// ===== 撤回 =====
function undo(){
  if(S.undo.length===0)return;
  const prev=S.undo.pop();
  // 还原IT中所有调整
  S.adj.forEach(a=>{const seg=IT.find(s=>s.id===a.segId);if(seg){seg.s=a.from.s;seg.e=a.from.e}});
  S.done=prev.done;S.act=prev.act;S.adj=prev.adj;
  save();renderDaily();renderOverview();showToast('↩️ 已撤回上次调整',2000);
}
function updateUndoBtn(){document.getElementById('undoBtn').disabled=S.undo.length===0}

// ===== 重置（不用 confirm，用自定义弹窗）=====
let resetPending=false;
function resetAll(){
  if(!resetPending){
    resetPending=true;
    document.getElementById('undoBtn').disabled=true;
    const btn=document.querySelector('[onclick="resetAll()"]');
    if(btn){btn.textContent='⚠️ 再点确认';btn.style.background='#fecaca';btn.style.color='#dc2626'}
    setTimeout(()=>{
      if(resetPending){
        resetPending=false;
        if(btn){btn.textContent='🔄重置';btn.style.background='';btn.style.color=''}
        updateUndoBtn();
      }
    },3000);
    return;
  }
  resetPending=false;
  S.adj.forEach(a=>{const seg=IT.find(s=>s.id===a.segId);if(seg){seg.s=a.from.s;seg.e=a.from.e}});
  S={done:{},act:{},adj:[],undo:[]};localStorage.removeItem('tp');
  const btn=document.querySelector('[onclick="resetAll()"]');
  if(btn){btn.textContent='🔄重置';btn.style.background='';btn.style.color=''}
  renderOverview();renderDaily();renderPacking();showToast('🔄 已重置所有进度',2000);
}

// ===== Toast =====
function showToast(msg,dur=3000){
  const c=document.getElementById('toasts'),t=document.createElement('div');
  t.className='toast bg-gray-800 text-white rounded-lg px-4 py-3 text-sm shadow-lg';t.textContent=msg;c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),300)},dur);
}

// ===== 攻略页 =====
let guideRendered=false;
function renderGuide(){
  if(guideRendered)return;guideRendered=true;
  const el=document.getElementById('tab-guide');
  el.innerHTML=`<div class="space-y-4">
    <div class="bg-white rounded-xl shadow-sm p-5"><h2 class="text-base font-bold text-gray-800 mb-4">👶 带两岁宝宝出行指南</h2><div class="space-y-3">
      <div class="border-l-[3px] border-amber-400 bg-amber-50 rounded-r-lg p-3"><h3 class="font-medium text-amber-800 text-sm">作息规律</h3><p class="text-xs text-amber-700 mt-1">尽量保持午睡习惯(12:00-14:00)，安排景点时留出午休时间。可用婴儿车的景区：德天瀑布、千花洲、鹅泉。</p></div>
      <div class="border-l-[3px] border-blue-400 bg-blue-50 rounded-r-lg p-3"><h3 class="font-medium text-blue-800 text-sm">防暑防晒</h3><p class="text-xs text-blue-700 mt-1">五一广西25-33°C紫外线强。遮阳帽、防晒霜SPF50+、防晒衣必备。每1-2h补涂。随身带湿巾和饮用水。</p></div>
      <div class="border-l-[3px] border-rose-400 bg-rose-50 rounded-r-lg p-3"><h3 class="font-medium text-rose-800 text-sm">饮食注意</h3><p class="text-xs text-rose-700 mt-1">广西菜偏酸辣，给宝宝单独点清淡菜。自带零食、奶粉。景区附近一般有便利店。</p></div>
      <div class="border-l-[3px] border-green-400 bg-green-50 rounded-r-lg p-3"><h3 class="font-medium text-green-800 text-sm">安全第一</h3><p class="text-xs text-green-700 mt-1">德天瀑布边有护栏但需看护；红海湾玩水必须全程牵手；自驾务必用安全座椅。</p></div>
      <div class="border-l-[3px] border-purple-400 bg-purple-50 rounded-r-lg p-3"><h3 class="font-medium text-purple-800 text-sm">就医准备</h3><p class="text-xs text-purple-700 mt-1">退烧药(布洛芬混悬液)、蒙脱石散、创可贴、驱蚊液、体温计。南宁/崇左市区有三甲医院。</p></div>
    </div></div>
    <div class="bg-white rounded-xl shadow-sm p-5"><h2 class="text-base font-bold text-gray-800 mb-4">🚗 自驾注意事项</h2><div class="space-y-3">
      <div class="border-l-[3px] border-cyan-400 bg-cyan-50 rounded-r-lg p-3"><h3 class="font-medium text-cyan-800 text-sm">路况</h3><p class="text-xs text-cyan-700 mt-1">崇左到德天山路弯多减速。靖西到崇左南走合那高速约2-2.5h。汕尾沿海五一可能拥堵提前出发。</p></div>
      <div class="border-l-[3px] border-cyan-400 bg-cyan-50 rounded-r-lg p-3"><h3 class="font-medium text-cyan-800 text-sm">加油</h3><p class="text-xs text-cyan-700 mt-1">低于半箱就加。大新县城、靖西市区、崇左南站附近均有加油站。</p></div>
      <div class="border-l-[3px] border-cyan-400 bg-cyan-50 rounded-r-lg p-3"><h3 class="font-medium text-cyan-800 text-sm">导航</h3><p class="text-xs text-cyan-700 mt-1">高德/百度均可，山区下载离线地图。德天瀑布景区有专用停车场旺季可能排队。</p></div>
      <div class="border-l-[3px] border-cyan-400 bg-cyan-50 rounded-r-lg p-3"><h3 class="font-medium text-cyan-800 text-sm">还车</h3><p class="text-xs text-cyan-700 mt-1">租车已预订。还车时加满油、清理、拍照。预留30-40min手续，保留合同和确认单。</p></div>
    </div></div>
    <div class="bg-white rounded-xl shadow-sm p-5"><h2 class="text-base font-bold text-gray-800 mb-4">🏞️ 景区贴士</h2><div class="space-y-3">
      <div class="border-2 border-emerald-200 rounded-lg p-3 bg-emerald-50"><h3 class="font-bold text-sm">🌊 德天跨国瀑布 <span class="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded ml-1">⏰10:00入园</span> <span class="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">已预约</span></h3><p class="text-xs text-gray-600 mt-1">📍崇左大新·55km | 🎫已预约 | ⏰4h | 💡10:00准时入园 | 👶推车可行有台阶建议背带</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">🏞️ 明仕田园</h3><p class="text-xs text-gray-600 mt-1">📍崇左大新·17km | 🎫80元+竹筏120元 | ⏰3h | 💡下午光线柔和适合拍照 | 👶竹筏宝宝友好穿救生衣</p></div>
      <div class="border-2 border-emerald-200 rounded-lg p-3 bg-emerald-50"><h3 class="font-bold text-sm">🏔️ 宁明花山岩画 <span class="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded ml-1">🔒10:30上船</span> <span class="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">已预约</span></h3><p class="text-xs text-gray-600 mt-1">📍崇左宁明·世遗 | 🎫已预约 | ⏰4h | 💡9:50前兑票·10:30准时上船 | 👶船平稳宝宝友好</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">💧 鹅泉 <span class="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">已购票</span></h3><p class="text-xs text-gray-600 mt-1">📍百色靖西·西南三名泉 | 🎫已购 | ⏰3h | 💡清晨如镜倒影美 | 👶步道平缓推车可行</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">🌸 千花洲 <span class="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">已购票</span></h3><p class="text-xs text-gray-600 mt-1">📍惠州惠城 | 🎫已购 | ⏰3h | 💡五月花海有儿童区 | 👶亲子友好步道平坦</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">🌀 风车岛</h3><p class="text-xs text-gray-600 mt-1">📍汕尾遮浪半岛 | 🎫免费 | ⏰4h | 💡风车+海景出片可环岛自驾 | 👶海边风大保暖</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">🏖️ 红海湾</h3><p class="text-xs text-gray-600 mt-1">📍汕尾遮浪半岛 | 🎫免费 | ⏰4h | 💡细软沙滩水质好适合亲子玩沙 | 👶带挖沙工具注意防晒</p></div>
    </div></div>
    <div class="bg-white rounded-xl shadow-sm p-5"><h2 class="text-base font-bold text-gray-800 mb-4">🆘 紧急信息</h2><div class="grid grid-cols-2 gap-3">
      <div class="bg-red-50 rounded-lg p-3"><div class="font-bold text-red-800 text-sm">报警/急救</div><div class="text-red-700 text-xs mt-1">110·120·122</div></div>
      <div class="bg-orange-50 rounded-lg p-3"><div class="font-bold text-orange-800 text-sm">道路救援</div><div class="text-orange-700 text-xs mt-1">租车公司救援电话</div></div>
      <div class="bg-blue-50 rounded-lg p-3"><div class="font-bold text-blue-800 text-sm">铁路客服</div><div class="text-blue-700 text-xs mt-1">12306</div></div>
      <div class="bg-teal-50 rounded-lg p-3"><div class="font-bold text-teal-800 text-sm">当地医院</div><div class="text-teal-700 text-xs mt-1">崇左市人医0771-7821120<br>靖西市人医0776-6212345</div></div>
    </div></div>
    <div class="bg-white rounded-xl shadow-sm p-5"><h2 class="text-base font-bold text-gray-800 mb-4">🍜 美食推荐</h2><div class="grid grid-cols-3 gap-3">
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">崇左/大新</h3><p class="text-xs text-gray-600 mt-1">烤猪·竹筒饭·五色糯米饭·柠檬鸭·酸嘢</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">靖西</h3><p class="text-xs text-gray-600 mt-1">米饺·卷筒粉·酸肉·番叽嘟</p></div>
      <div class="border border-gray-100 rounded-lg p-3"><h3 class="font-bold text-sm">汕尾</h3><p class="text-xs text-gray-600 mt-1">海鲜大排档·菜茶·擂茶·小米粥·牛肉饼</p></div>
    </div></div>
    <div class="bg-white rounded-xl shadow-sm p-5"><h2 class="text-base font-bold text-gray-800 mb-4">🚨 意外预案</h2><p class="text-xs text-gray-500 mb-3">提前想好B计划，遇事不慌</p><div class="space-y-2">
${EMERGENCIES.map((e,i)=>`<div class="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"><div class="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">${i+1}</div><div class="min-w-0"><div class="text-sm font-medium text-gray-800">${e.t}</div><div class="text-xs text-gray-500 mt-0.5">→ ${e.a}</div></div></div>`).join('')}
    </div></div>
  </div>`;
}

// ===== 行李清单 =====
const PACK=[
  {cat:'📄 证件（均已预订✅）',items:['身份证(4人)','宝宝出生证明/户口本','高铁票截图(4程已购)','驾照','租车订单截图(已预订)','酒店确认截图(5家已订)','德天瀑布门票截图(已预约)','花山岩画门票截图(已预约)','鹅泉+千花洲门票截图(已购)']},
  {cat:'👶 宝宝用品',items:['奶粉/牛奶','宝宝餐具水杯','尿不湿(足量)','湿巾纸巾','换洗衣物(每天1-2套)','薄外套(防空调海风)','遮阳帽','推车','背带','常用药品','小玩具绘本','零食']},
  {cat:'👕 衣物',items:['短袖3-4件/人','薄长袖1件/人','薄外套1件/人','长裤2条/人','短裤2条/人','内衣裤足量','袜子','运动鞋','凉鞋/拖鞋','泳衣','防晒衣']},
  {cat:'💊 药品',items:['退烧药(布洛芬)','蒙脱石散','创可贴','驱蚊液','防晒霜SPF50+','体温计','晕车药','感冒药','肠胃药']},
  {cat:'🚗 车载',items:['手机支架','车载充电器','矿泉水','纸巾','垃圾袋','安全座椅']},
  {cat:'📱 电子',items:['手机充电器','充电宝','耳机','相机/自拍杆']},
  {cat:'🧴 洗护',items:['牙刷牙膏','洗发水沐浴露','毛巾','护肤霜','剃须刀']},
  {cat:'🎒 其他',items:['雨伞','塑料袋(装湿衣)','保温杯','零食','现金(少量)','银行卡']}
];
let packingState={};
function loadPacking(){try{const s=localStorage.getItem('tpPack');if(s)packingState=JSON.parse(s)}catch(e){}}
function savePacking(){try{localStorage.setItem('tpPack',JSON.stringify(packingState))}catch(e){}}
function togglePack(key){
  packingState[key]=!packingState[key];savePacking();
  const el=document.getElementById('pk-'+key);
  if(el)el.classList.toggle('done',packingState[key]);
  const total=PACK.reduce((a,c)=>a+c.items.length,0);
  const done=Object.values(packingState).filter(v=>v).length;
  const pctEl=document.getElementById('pack-pct');
  if(pctEl)pctEl.textContent=Math.round(done/total*100)+'%';
  renderPacking();
}
function renderPacking(){
  const el=document.getElementById('tab-packing');
  const total=PACK.reduce((a,c)=>a+c.items.length,0);
  const done=Object.values(packingState).filter(v=>v).length;
  let h=`<div class="bg-white rounded-xl shadow-sm p-5 mb-4">
    <div class="flex items-center justify-between mb-3"><h2 class="text-base font-bold text-gray-800">🎒 行李清单</h2><div class="text-sm text-teal-600 font-medium"><span id="pack-pct">${total?Math.round(done/total*100):0}%</span> 已准备</div></div>
    <div class="w-full bg-gray-100 rounded-full h-2 mb-1"><div class="h-2 rounded-full bg-teal-500" style="width:${total?done/total*100:0}%"></div></div>
    <div class="text-xs text-gray-400">${done}/${total}项</div></div>`;
  h+='<div class="space-y-3">';
  PACK.forEach((cat,ci)=>{
    h+=`<div class="bg-white rounded-xl shadow-sm p-4"><h3 class="font-bold text-gray-800 text-sm mb-3">${cat.cat}</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
    cat.items.forEach((item,ii)=>{
      const key=ci+'_'+ii;
      const checked=!!packingState[key];
      h+=`<div class="pi ${checked?'done':''} flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50" id="pk-${key}" onclick="togglePack('${key}')">
        <div class="w-5 h-5 rounded border-2 ${checked?'bg-teal-500 border-teal-500':'border-gray-300'} flex items-center justify-center text-white text-xs">${checked?'✓':''}</div>
        <span class="text-sm text-gray-700">${item}</span></div>`;
    });
    h+='</div></div>';
  });
  h+='</div>';
  el.innerHTML=h;
}

// ===== 初始化 =====
load();loadPacking();renderOverview();