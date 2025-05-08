import React, { useState, useEffect, useCallback, useRef } from "react";
import html2canvas from "html2canvas";

/**
 * Eric's Booth Setup Visualizer v1.3 – save / export restored & mobile polish
 * -------------------------------------------------------------------------
 *  • Save / Load layouts (localStorage) via dropdown + button
 *  • Export high‑res PNG (html2canvas) back in header
 *  • Canvas and cards scale to 90 % of viewport width (≤500 px)
 *  • Uses flex‑wrap + responsive Tailwind to keep controls on‑screen
 */

export default function BoothVisualizer() {
  /* ---------- viewport width ---------- */
  const [vpW, setVpW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setVpW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  /* ---------- booth settings ---------- */
  const [floorW, setFloorW] = useState(20);
  const [floorH, setFloorH] = useState(20);
  const [floorColor, setFloorColor] = useState("#ffffff");

  /* ---------- catalog ---------- */
  const baseCatalog = [
    { key: "tree", label: "Tree", shape: "circ", diameter: 0.75, color: "#3CB371" },
    { key: "table", label: "Table", shape: "rect", width: 2.5, height: 2.5, color: "#B5651D" },
    { key: "shelf", label: "Shelf", shape: "rect", width: 2, height: 1, color: "#8B4513" },
    { key: "backdrop", label: "Backdrop", shape: "rect", width: 10, height: 1, color: "#1E90FF" },
  ];
  const [userCat, setUserCat] = useState(() => {
    try { return JSON.parse(localStorage.getItem("userCatalog") || "[]"); } catch { return []; }
  });
  const saveUserCat = (arr) => { setUserCat(arr); localStorage.setItem("userCatalog", JSON.stringify(arr)); };
  const catalog = [...baseCatalog, ...userCat];

  /* ---------- items ---------- */
  const makeItem = (preset) => ({
    id: crypto.randomUUID(),
    presetKey: preset?.key || "custom",
    name: preset?.label || "Item",
    shape: preset?.shape || "rect",
    width: preset?.width || 1,
    height: preset?.height || 1,
    diameter: preset?.diameter || 1,
    x: 0,
    y: 0,
    color: preset?.color || `hsl(${Math.random()*360} 70% 60%)`,
    rotation: 0,
  });
  const [items, setItems] = useState([makeItem()]);
  const updateItem = (idx, field, value) => setItems(p=>p.map((it,i)=>i===idx?({...it,[field]:value}):it));

  /* ---------- layouts (save / load) ---------- */
  const [layouts, setLayouts] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("savedLayouts")||"{}"); } catch { return {}; }
  });
  const saveLayouts = (obj)=>{ setLayouts(obj); localStorage.setItem("savedLayouts",JSON.stringify(obj)); };
  const handleSaveLayout = () => {
    const name = prompt("Name this layout:");
    if(!name) return;
    saveLayouts({ ...layouts, [name]: { floorW, floorH, floorColor, items } });
  };
  const handleLoadLayout = (name) => {
    const L = layouts[name]; if(!L) return;
    setFloorW(L.floorW); setFloorH(L.floorH); setFloorColor(L.floorColor);
    setItems(L.items.map(it=>({ ...it, id: crypto.randomUUID() })));
  };

  /* ---------- geometry ---------- */
  const maxCanvas = Math.min(vpW * 0.9, 500);
  const scale = Math.min(maxCanvas / floorW, maxCanvas / floorH);
  const px = (ft)=>ft*scale;

  /* ---------- drag ---------- */
  const [drag,setDrag]=useState(null);
  const onMove=useCallback(e=>{
    if(!drag) return;
    const {id,ox,oy}=drag; const R=e.currentTarget.getBoundingClientRect();
    const xPx=Math.min(Math.max(e.clientX-R.left-ox,0),px(floorW));
    const yPx=Math.min(Math.max(e.clientY-R.top -oy,0),px(floorH));
    setItems(p=>p.map(it=>it.id===id?({...it,x:xPx/scale,y:yPx/scale}):it));
  },[drag,floorW,floorH,scale]);
  const startDrag=(e,id)=>{const b=e.currentTarget.getBoundingClientRect();setDrag({id,ox:e.clientX-b.left,oy:e.clientY-b.top});};
  const endDrag=()=>setDrag(null);

  /* ---------- export PNG ---------- */
  const exportRef=useRef(null);
  const handleExport = async ()=>{
    if(!exportRef.current) return;
    const canvas=await html2canvas(exportRef.current,{backgroundColor:null,scale:3,useCORS:true});
    const link=document.createElement("a"); link.download="booth-layout.png"; link.href=canvas.toDataURL("image/png"); link.click();
  };

  /* ---------- ui classes ---------- */
  const inputC="border rounded-md p-2 ring-offset-2 focus:ring-2 focus:ring-sky-500 w-full";
  const colorC="border rounded-md h-10 p-1 ring-offset-2 focus:ring-2 focus:ring-sky-500 w-full";
  const cardC="bg-white shadow-xl rounded-2xl p-5";

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-gray-100 py-6 px-3 flex justify-center">
      <div className="w-full max-w-6xl space-y-8">
        {/* header */}
        <header className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 text-white rounded-2xl shadow-lg flex flex-wrap items-center gap-3 p-3 justify-between">
          <h1 className="text-lg sm:text-2xl font-bold flex-1">Eric’s Booth Setup Visualizer</h1>
          <select className="text-black rounded-md p-1" onChange={e=>handleLoadLayout(e.target.value)} defaultValue="">
            <option value="">Load…</option>
            {Object.keys(layouts).map(k=>(<option key={k} value={k}>{k}</option>))}
          </select>
          <button onClick={handleSaveLayout} className="bg-white/20 px-3 py-1.5 rounded-lg">Save</button>
          <button onClick={handleExport} className="bg-white/20 px-3 py-1.5 rounded-lg">PNG</button>
        </header>

        {/* booth settings */}
        <section className={cardC}>
          <h2 className="text-base font-semibold mb-2">Booth Settings</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col text-sm">Width (ft)
              <input type="number" min="1" value={floorW} className={inputC} onChange={e=>setFloorW(+e.target.value)}/>
            </label>
            <label className="flex flex-col text-sm">Depth (ft)
              <input type="number" min="1" value={floorH} className={inputC} onChange={e=>setFloorH(+e.target.value)}/>
            </label>
            <label className="flex flex-col text-sm">Color
              <input type="color" value={floorColor} className={colorC} onChange={e=>setFloorColor(e.target.value)}/>
            </label>
          </div>
        </section>

        {/* items editor */}
        <section className={cardC+" space-y-5"}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-semibold">Items</h2>
            <button onClick={()=>setItems(i=>[...i,makeItem()])} className="bg-sky-600 text-white px-2 py-1 rounded-md">+ Item</button>
          </div>
          {items.map((it,idx)=>{
            const presets=[{key:"custom",label:"Custom"},...catalog];
            const isCustom=it.presetKey==="custom";
            return (
              <div key={it.id} className="bg-sky-50 rounded-md p-3 ring-1 ring-sky-300 space-y-3">
                <div className="grid gap-3 sm:grid-cols-6 items-end">
                  {/* preset toggle */}
                  <label className="flex flex-col text-xs sm:text-sm col-span-2">Preset / Custom
                    <select value={it.presetKey} className={inputC} onChange={e=>{
                      const key=e.target.value;
                      updateItem(idx,'presetKey',key);
                      if(key!=="custom"){
                        const pre=catalog.find(c=>c.key===key);
                        setItems(p=>p.map((o,i)=>i===idx?({...o,name:pre.label,shape:pre.shape,width:pre.width||o.width,height:pre.height||o.height,diameter:pre.diameter||o.diameter,color:pre.color}):o));
                      }
                    }}>
                      {presets.map(p=>(<option key={p.key} value={p.key}>{p.label}</option>))}
                    </select>
                  </label>
                  <label className="flex flex-col text-xs sm:text-sm">Name
                    <input disabled={!isCustom} value={it.name} className={inputC} onChange={e=>updateItem(idx,'name',e.target.value)}/>
                  </label>
                  <label className="flex flex-col text-xs sm:text-sm">Shape
                    <select disabled={!isCustom} value={it.shape} className={inputC} onChange={e=>updateItem(idx,'shape',e.target.value)}>
                      <option value="rect">Rect</option><option value="circ">Circle</option>
                    </select>
                  </label>
                  {it.shape==='rect'?<>
                    <label className="flex flex-col text-xs sm:text-sm">W
                      <input disabled={!isCustom} type="number" min="0.1" value={it.width} className={inputC} onChange={e=>updateItem(idx,'width',+e.target.value)}/>
                    </label>
                    <label className="flex flex-col text-xs sm:text-sm">H
                      <input disabled={!isCustom} type="number" min="0.1" value={it.height} className={inputC} onChange={e=>updateItem(idx,'height',+e.target.value)}/>
                    </label>
                  </>:<label className="flex flex-col text-xs sm:text-sm">Dia
                      <input disabled={!isCustom} type="number" min="0.1" value={it.diameter} className={inputC} onChange={e=>updateItem(idx,'diameter',+e.target.value)}/>
                    </label>}
                  <label className="flex flex-col text-xs sm:text-sm">Color
                    <input disabled={!isCustom} type="color" value={it.color} className={colorC} onChange={e=>updateItem(idx,'color',e.target.value)}/>
                  </label>
                </div>
              </div>
            );
          })}
        </section>

        {/* canvas / export region */}
        <section ref={exportRef} className={cardC}>
          <h2 className="text-base font-semibold mb-2">Floor Plan</h2>
          <div className="mx-auto" style={{maxWidth:maxCanvas}}>
            <div className="relative border-2 border-sky-600 rounded-md" style={{width:px(floorW),height:px(floorH),backgroundColor:floorColor}} onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
              {/* dimensions labels */}
              <span style={{position:'absolute',left:'50%',top:-16,transform:'translateX(-50%)',fontSize:10,fontWeight:600,color:'#0369a1'}}>{floorW} ft</span>
              <span style={{position:'absolute',left:-26,top:'50%',transform:'translateY(-50%) rotate(-90deg)',fontSize:10,fontWeight:600,color:'#0369a1'}}>{floorH} ft</span>
              {items.map(it=>{
                const w=px(it.shape==='rect'?it.width:it.diameter);
                const h=px(it.shape==='rect'?it.height:it.diameter);
                return <div key={it.id} onPointerDown={e=>startDrag(e,it.id)} style={{position:'absolute',left:it.x*scale,top:it.y*scale,width:w,height:h,backgroundColor:it.color,border:'2px solid rgba(0,0,0,0.3)',borderRadius:it.shape==='circ'?'50%':'0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:600,color:'#0f172a',transform:`rotate(${it.rotation}deg)`,touchAction:'none',cursor:'grab'}}>{w>40&&h>18&&it.name}</div>;
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import ReactDOM from "react-dom";
ReactDOM.createRoot(document.getElementById("root")).render(<BoothVisualizer/>);
