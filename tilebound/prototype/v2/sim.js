const TB=require('./engine.js');
const n=+process.argv[2]||600;
const t0=Date.now(); const st=TB.simulate(n,+process.argv[3]||5,{secondSwap:process.argv[4]>='2',courtesy:process.argv[4]==='3'}); const ms=Date.now()-t0; const w=st.wins;
console.log('targets',TB.TARGETS.length,'ms',ms,'rounds/hand',(st.rounds/st.hands).toFixed(1),'wall%',(100*st.wall/st.hands).toFixed(1),'east%',(100*st.east/w).toFixed(1),'self%',(100*st.self/w).toFixed(1),'mimic%',(100*st.mimicWins/w).toFixed(1));
TB.HANDS.forEach((h,i)=>console.log(h.name.padEnd(16),(100*st.byHand[i]/w).toFixed(1)+'%'));
