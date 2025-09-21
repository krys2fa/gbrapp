(async()=>{
  const base='http://localhost:3000';
  const roles=['EXECUTIVE','SMALL_SCALE_ASSAYER','LARGE_SCALE_ASSAYER'];
  for(const r of roles){
    const email=`smoke_${r.toLowerCase()}@example.com`;
    try{
      const res=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Test1234!',name:'Smoke '+r,role:r})});
      console.log('\nRole',r,'status',res.status);
      const txt=await res.text();
      console.log('body:',txt);
    }catch(e){
      console.error('err',e);
    }
  }
})();
