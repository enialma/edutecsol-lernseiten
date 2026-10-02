// SCORM-1.2-Paket aus einer Lernseite: imsmanifest.xml + index.html (+ eingebetteter SCORM-Adapter).
// Beim Öffnen meldet die Seite dem LMS «completed»; läuft die Seite ausserhalb eines LMS, passiert nichts.
import JSZip from "jszip";
import { withPrintCss } from "./print";

const SCORM_JS = `
(function(){
  var api=null;
  function find(w){var n=0;while(w&&!w.API&&n<10){if(w.parent===w)break;w=w.parent;n++;}return (w&&w.API)||null;}
  try{api=find(window);if(!api&&window.opener)api=find(window.opener);}catch(e){}
  if(!api)return;
  try{
    api.LMSInitialize("");
    var st=api.LMSGetValue("cmi.core.lesson_status");
    if(st==="not attempted"||st===""){api.LMSSetValue("cmi.core.lesson_status","completed");}
    api.LMSCommit("");
    var t0=Date.now();
    function finish(){
      try{
        var s=Math.floor((Date.now()-t0)/1000);
        var h=("0"+Math.floor(s/3600)).slice(-2),m=("0"+Math.floor(s%3600/60)).slice(-2),x=("0"+(s%60)).slice(-2);
        api.LMSSetValue("cmi.core.session_time",h+":"+m+":"+x);
        api.LMSCommit("");api.LMSFinish("");
      }catch(e){}
    }
    window.addEventListener("beforeunload",finish);
    window.addEventListener("pagehide",finish);
  }catch(e){}
})();
`;

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function manifest(id: string, title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>${esc(title)}</title>
      <item identifier="item1" identifierref="res1" isvisible="true">
        <title>${esc(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>
`;
}

export async function lernseiteToScorm(html: string, meta: { id: number; title: string }): Promise<Buffer> {
  let page = withPrintCss(html);
  const tag = `<script id="lernwege-scorm">${SCORM_JS}</script>`;
  const i = page.search(/<\/body>/i);
  page = i >= 0 ? page.slice(0, i) + tag + page.slice(i) : page.replace(/<\/html>/i, tag + "</html>");
  const zip = new JSZip();
  zip.file("imsmanifest.xml", manifest(`lernwege-${meta.id}`, meta.title));
  zip.file("index.html", page);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
