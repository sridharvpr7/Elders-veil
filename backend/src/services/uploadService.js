const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const env=require('../config/env');

class UploadService {
  static localUrl(file){ const rel=file.path.replace(path.join(__dirname,'../../..'),'').replace(/\\/g,'/'); const clean=rel.startsWith('/')?rel:`/${rel}`; return env.UPLOAD_BASE_URL ? `${String(env.UPLOAD_BASE_URL).replace(/\/+$/,'')}${clean}` : clean; }
  static cloudinarySignature(params){ const canonical=Object.keys(params).filter(k=>params[k]!==undefined&&params[k]!==''&&k!=='file'&&k!=='api_key'&&k!=='resource_type').sort().map(k=>`${k}=${params[k]}`).join('&'); return crypto.createHash('sha1').update(canonical+env.CLOUDINARY_API_SECRET).digest('hex'); }
  static async cloudinaryUpload(file,folder='elders-veil') {
    if(env.STORAGE_PROVIDER!=='cloudinary') return this.localUrl(file);
    if(!env.CLOUDINARY_CLOUD_NAME||!env.CLOUDINARY_API_KEY||!env.CLOUDINARY_API_SECRET) throw new Error('Cloudinary storage is enabled but credentials are missing.');
    const timestamp=Math.floor(Date.now()/1000);
    const params={folder,timestamp};
    const fd=new FormData(); fd.append('file',new Blob([fs.readFileSync(file.path)],{type:file.mimetype}),file.originalname); fd.append('api_key',env.CLOUDINARY_API_KEY); fd.append('timestamp',String(timestamp)); fd.append('folder',folder); fd.append('signature',this.cloudinarySignature(params));
    const r=await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,{method:'POST',body:fd});
    const b=await r.json().catch(()=>({})); if(!r.ok) throw new Error(b.error?.message||'Cloudinary upload failed.');
    try{fs.unlinkSync(file.path);}catch(_e){}
    return b.secure_url;
  }
  static async processSingleFile(file,folder='uploads') { return this.cloudinaryUpload(file,folder); }
  static async processMultipleFiles(files,folder='uploads') { const urls=[]; for(const f of files) urls.push(await this.cloudinaryUpload(f,folder)); return urls; }
}
module.exports=UploadService;
