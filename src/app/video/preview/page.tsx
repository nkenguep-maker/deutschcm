export default function VideoPreview() {
  return (
    <div style={{minHeight:"100vh",background:"#080c10",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace"}}>
      <div style={{textAlign:"center",maxWidth:480,padding:40}}>
        <div style={{fontSize:64,marginBottom:16}}>🎬</div>
        <h1 style={{fontFamily:"'Syne',sans-serif",color:"white",fontSize:24,fontWeight:800,margin:"0 0 12px"}}>
          Vidéos de cours
        </h1>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,margin:"0 0 24px",lineHeight:1.7}}>
          Nous préparons des vidéos animées pour chaque leçon.<br/>
          Cette fonctionnalité sera disponible très bientôt.
        </p>
        <a href="/courses" style={{display:"inline-block",padding:"12px 24px",borderRadius:12,background:"linear-gradient(135deg,#10b981,#059669)",color:"white",textDecoration:"none",fontSize:13,fontWeight:700}}>
          📚 Voir les cours disponibles
        </a>
      </div>
    </div>
  )
}
