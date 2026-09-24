const env=require('../config/env');
class EmailService {
  static async send({to,subject,text,html=''}) {
    if(!env.RESEND_API_KEY || !env.EMAIL_FROM || !to) return {sent:false,reason:'Email provider not configured.'};
    try {
      const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject,text,html:html||`<p>${String(text).replace(/\n/g,'<br>')}</p>`})});
      const b=await r.json().catch(()=>({})); return {sent:r.ok,id:b.id,body:b};
    } catch(e){return {sent:false,reason:e.message};}
  }
}
module.exports=EmailService;
