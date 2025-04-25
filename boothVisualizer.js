const { useState, useEffect, useCallback, useRef } = React;

function BoothVisualizer() {
  /* ───────── state ───────── */
  const [floorWidth,  setFloorWidth]  = useState(20);
  const [floorHeight, setFloorHeight] = useState(20);
  const [floorColor,  setFloorColor]  = useState("#ffffff");
  const [itemCount,   setItemCount]   = useState(1);

  /* ───────── items ───────── */
  const starterColor = i => `hsl(${(i*45)%360} 70% 60%)`;
  const makeItem = i => ({
    id: i+1, name:`Item ${i+1}`, shape:"rect",
    width:1, height:1, diameter:1,
    x:0, y:0, color: starterColor(i), rotation:0,
  });
  const [items,setItems] = useState([makeItem(0)]);
  useEffect(() => {
    setItems(prev=>{
      const next=[...prev];
      if(itemCount>next.length) for(let i=next.length;i<itemCount;i++) next.push(makeItem(i));
      else if(itemCount<next.length) next.length=itemCount;
      return next;
    });
  },[itemCount]);
  const updateItem = (idx,f,v)=>setItems(p=>p.map((it,i)=>i===idx?({...it,[f]:v}):it));

  /* ───────── layout ───────── */
  const scale = Math.min(500/floorWidth,500/floorHeight);
  const boothPx = {w:floorWidth*scale,h:floorHeight*scale};

  /* ───────── drag ───────── */
  const [drag,setDrag]=useState(null);
  const onMove=useCallback(e=>{
    if(!drag) return;
    const {idx,ox,oy}=drag, R=e.currentTarget.getBoundingClientRect();
    const xPx=Math.min(Math.max(e.clientX-R.left-ox,0),boothPx.w);
    const yPx=Math.min(Math.max(e.clientY-R.top -oy,0),boothPx.h);
    setItems(p=>p.map((it,i)=>i===idx?({...it,x:xPx/scale,y:yPx/scale}):it));
  },[drag,boothPx.w,boothPx.h,scale]);
  const startDrag=(e,idx)=>{
    const b=e.currentTarget.getBoundingClientRect();
    setDrag({idx,ox:e.clientX-b.left,oy:e.clientY-b.top});
  };
  const endDrag=()=>setDrag(null);

  /* ───────── export ───────── */
  const exportRef=useRef(null);
  const handleExport=async()=>{
    if(!exportRef.current) return;
    const canvas = await html2canvas(exportRef.current,{
      backgroundColor:null,scale:3,useCORS:true,
      ignoreElements:el=>el.classList?.contains("no-export")
    });
    const link=document.createElement("a");
    link.download="booth-layout.png";
    link.href=canvas.toDataURL("image/png");
    link.click();
  };

  /* ───────── helpers ───────── */
  const inputCls="border rounded-md p-2 ring-offset-2 focus:ring-2 focus:ring-indigo-500";
  const colorCls="border rounded-md h-10 p-1 ring-offset-2 focus:ring-2 focus:ring-indigo-500";
  const cardCls="bg-white shadow-xl rounded-2xl p-6";

  /* ───────── UI ───────── */
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center">
      <div className="w-full max-w-7xl space-y-10">
        {/* header */}
        <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-3xl shadow-lg flex items-center justify-between py-4 px-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Booth Setup Visualizer</h1>
          <button onClick={handleExport} className="no-export bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg">Export PNG</button>
        </header>

        {/* controls */}
        <section className={cardCls}>
          <h2 className="text-xl font-semibold mb-4">Booth & Global Settings</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <label className="flex flex-col text-sm font-medium">Floor width (ft)
              <input type="number" min="1" value={floorWidth} className={inputCls} onChange={e=>setFloorWidth(+e.target.value)}/>
            </label>
            <label className="flex flex-col text-sm font-medium">Floor depth (ft)
              <input type="number" min="1" value={floorHeight} className={inputCls} onChange={e=>setFloorHeight(+e.target.value)}/>
            </label>
            <label className="flex flex-col text-sm font-medium">Floor color
              <input type="color"  value={floorColor} className={colorCls} onChange={e=>setFloorColor(e.target.value)}/>
            </label>
            <label className="flex flex-col text-sm font-medium"># of items
              <input type="number" min="0" value={itemCount} className={inputCls} onChange={e=>setItemCount(+e.target.value)}/>
            </label>
          </div>
        </section>

        {/* items */}
        <section className={cardCls+" space-y-6"}>
          <h2 className="text-xl font-semibold">Items</h2>
          {items.map((it,idx)=>(
            <div key={it.id} className="bg-gray-50 rounded-xl p-4 ring-1 ring-gray-200 space-y-3">
              <div className="grid gap-4 sm:grid-cols-6 items-end">
                <label className="flex flex-col text-sm font-medium">Name
                  <input type="text" value={it.name} className={inputCls} onChange={e=>updateItem(idx,'name',e.target.value)}/>
                </label>

                <label className="flex flex-col text-sm font-medium">Shape
                  <select value={it.shape} className={inputCls} onChange={e=>updateItem(idx,'shape',e.target.value)}>
                    <option value="rect">Rectangle</option><option value="circ">Circle</option>
                  </select>
                </label>

                {it.shape==='rect' ? <>
                  <label className="flex flex-col text-sm font-medium">Width (ft)
                    <input type="number" min="0.1" value={it.width} className={inputCls} onChange={e=>updateItem(idx,'width',+e.target.value)}/>
                  </label>
                  <label className="flex flex-col text-sm font-medium">Height (ft)
                    <input type="number" min="0.1" value={it.height} className={inputCls} onChange={e=>updateItem(idx,'height',+e.target.value)}/>
                  </label>
                </> : (
                  <label className="flex flex-col text-sm font-medium col-span-2">Diameter (ft)
                    <input type="number" min="0.1" value={it.diameter} className={inputCls} onChange={e=>updateItem(idx,'diameter',+e.target.value)}/>
                  </label>
                )}

                <label className="flex flex-col text-sm font-medium">Color
                  <input type="color" value={it.color} className={colorCls} onChange={e=>updateItem(idx,'color',e.target.value)}/>
                </label>

                <label className="flex flex-col text-sm font-medium">Rotation (°)
                  <input type="number" min="0" max="359" value={it.rotation} className={inputCls} onChange={e=>updateItem(idx,'rotation',( +e.target.value)%360)}/>
                </label>
              </div>
            </div>
          ))}
        </section>

        {/* canvas + legend */}
        <div className="flex flex-col lg:flex-row gap-8" ref={exportRef}>
          {/* canvas */}
          <section className={cardCls+" w-full lg:w-auto"}>
            <h2 className="text-xl font-semibold mb-4">Floor Plan</h2>
            <div className="relative border-2 border-gray-400 rounded-lg overflow-visible"
                 style={{width:boothPx.w,height:boothPx.h,backgroundColor:floorColor}}
                 onPointerMove={onMove} onPointerUp={endDrag} onPointerLeave={endDrag}>
              {/* booth dimensions outside */}
              <span style={{position:'absolute',left:'50%',top:-20,transform:'translateX(-50%)',fontSize:12,fontWeight:600}}>{floorWidth} ft</span>
              <span style={{position:'absolute',left:-28,top:'50%',transform:'translateY(-50%) rotate(-90deg)',fontSize:12,fontWeight:600}}>{floorHeight} ft</span>

              {/* items */}
              {items.map((it,idx)=>{
                const wFt = it.shape==='rect'?it.width:it.diameter;
                const hFt = it.shape==='rect'?it.height:it.diameter;
                const wPx = wFt*scale, hPx = hFt*scale;
                const showLabel = wPx>40 && hPx>24;
                return (
                  <div key={it.id}
                       onPointerDown={e=>startDrag(e,idx)}
                       style={{
                         position:'absolute',left:it.x*scale,top:it.y*scale,
                         width:wPx,height:hPx,backgroundColor:it.color,
                         border:'2px solid rgba(0,0,0,0.4)',
                         borderRadius:it.shape==='circ'?'9999px':'0',
                         display:'flex',alignItems:'center',justifyContent:'center',
                         fontSize:10,fontWeight:600,color:'#1f2937',
                         transform:`rotate(${it.rotation}deg)`,cursor:'grab'
                       }}>
                       {showLabel && it.name}
                  </div>
                );
              })}
            </div>
          </section>

          {/* legend */}
          <aside className={cardCls+" lg:w-72 h-fit"}>
            <h2 className="text-xl font-semibold mb-4">Legend</h2>
            <ul className="space-y-3 text-sm">
              {items.map(it=>(
                <li key={it.id} className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded" style={{backgroundColor:it.color}}></span>
                  <div className="flex-1">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-gray-600">
                      {it.shape==='rect'
                        ? `${it.width}×${it.height}ft`
                        : `Ø${it.diameter}ft`
                      } · {it.rotation}° · {it.x.toFixed(1)}/{it.y.toFixed(1)}ft
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<BoothVisualizer/>);
