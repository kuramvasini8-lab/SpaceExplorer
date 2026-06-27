const $=id=>document.getElementById(id);
const el={
launchContainer:$("launchContainer"),
loading:$("loading"),
error:$("error"),
searchInput:$("searchInput"),
modal:$("modal"),
modalBody:$("modalBody"),
closeModal:$("closeModal"),
upcomingBtn:$("upcomingBtn"),
previousBtn:$("previousBtn"),
themeToggle:$("themeToggle"),
rocketContainer:$("rocketContainer"),
newsContainer:$("newsContainer"),
launchCount:$("launchCount"),
agencyCount:$("agencyCount"),
locationCount:$("locationCount"),
rocketCount:$("rocketCount"),
utcClock:$("utcClock"),
localClock:$("localClock")
};
let launches=[];
const FALLBACK_IMG=
"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200";
const showError=msg=>{
el.loading.style.display="none";
el.error.style.display="block";
el.error.innerHTML=msg;
};
const setStats=data=>{
const agencies=new Set(),
locations=new Set(),
rockets=new Set();

data.forEach(l=>{
l.launch_service_provider?.name&&agencies.add(l.launch_service_provider.name);
l.pad?.location?.name&&locations.add(l.pad.location.name);
l.rocket?.configuration?.name&&rockets.add(l.rocket.configuration.name);
});

el.launchCount.textContent=data.length;
el.agencyCount.textContent=agencies.size;
el.locationCount.textContent=locations.size;
el.rocketCount.textContent=rockets.size;
};
const startCountdown=(date,node)=>{
const timer=setInterval(()=>{
let diff=new Date(date)-Date.now();
if(diff<=0){
clearInterval(timer);
node.innerHTML="🚀 Launched";
return;
}
const d=Math.floor(diff/864e5);
const h=Math.floor(diff/36e5%24);
const m=Math.floor(diff/6e4%60);
const s=Math.floor(diff/1e3%60);
node.innerHTML=`
<div class="time-box"><h3>${d}</h3><p>Days</p></div>
<div class="time-box"><h3>${h}</h3><p>Hours</p></div>
<div class="time-box"><h3>${m}</h3><p>Min</p></div>
<div class="time-box"><h3>${s}</h3><p>Sec</p></div>`;
},1000);
};
const openModal=(title,content,image)=>{
el.modal.style.display="block";
el.modalBody.innerHTML=`
<img src="${image}" alt="${title}">
<h2>${title}</h2>
<div>${content}</div>`;
};
const showDetails=l=>{
openModal(
l.name||"Mission",
`<p><strong>Agency:</strong> ${l.launch_service_provider?.name||"Unknown"}</p>
<p><strong>Rocket:</strong> ${l.rocket?.configuration?.name||"Unknown"}</p>
<p><strong>Location:</strong> ${l.pad?.location?.name||"Unknown"}</p>
<p><strong>Launch Time:</strong> ${new Date(l.net).toLocaleString()}</p>
<p><strong>Status:</strong> ${l.status?.name||"Upcoming"}</p>
<h3>🎯 Mission Purpose</h3><p>${l.mission?.description ||"Mission description not available."}</p>
`,
l.image||FALLBACK_IMG
);
};
const renderLaunches=data=>{
el.launchContainer.innerHTML="";
if(!data.length){
el.launchContainer.innerHTML="<h2>No Launches Found</h2>";
return;
}

data.forEach(l=>{
const status=l.status?.name||"Upcoming";
let cls="go";
if(status.toLowerCase().includes("hold"))cls="hold";
if(status.toLowerCase().includes("fail"))cls="failure";
const card=document.createElement("div");
card.className="card";
card.innerHTML=`
<img src="${l.image||FALLBACK_IMG}"
onerror="this.src='${FALLBACK_IMG}'">
<div class="card-content">
<h2>${l.name||"Unknown Mission"}</h2>
<p><strong>Agency:</strong>
${l.launch_service_provider?.name||"Unknown"}
</p>
<p><strong>Local:</strong>
${new Date(l.net).toLocaleString()}
</p>
<span class="status ${cls}">
${status}
</span>
<div class="countdown" id="c-${l.id}"></div>
<div class="btn-group">
<button class="btn details-btn">
🚀 Mission Details
</button>
</div>
</div>`;
el.launchContainer.appendChild(card);
card.querySelector(".details-btn")
.addEventListener("click",()=>showDetails(l));
const cd=$(`c-${l.id}`);
new Date(l.net)>new Date()
?startCountdown(l.net,cd)
:cd.innerHTML=
"<h3 style='color:#22c55e'>✅ Mission Completed</h3>";
});
};
async function fetchLaunches(type="upcoming"){
try{
el.error.style.display="none";
const res=await fetch(
`https://ll.thespacedevs.com/2.2.0/launch/${type}/?limit=20`
);
if(res.status===429)
throw new Error("⚠ API Rate Limit Reached");
if(!res.ok)
throw new Error("Unable to Load Launches");
const data=await res.json();
launches=data.results||[];
setStats(launches);
renderLaunches(launches);
}catch(err){
showError(err.message||"Error Loading Launches");
}
}
async function fetchRockets() {
  if (!el.rocketContainer) return;

  try {
    el.rocketContainer.innerHTML =
      "<p>Loading Rockets...</p>";

    const res = await fetch(
      "https://ll.thespacedevs.com/2.2.0/config/launcher/?limit=50"
    );

    if (!res.ok)
      throw new Error("Unable to load rockets");

    const data = await res.json();
    const rockets = data.results || [];

    // Remove duplicate rocket names
    const uniqueRockets = [
      ...new Map(
        rockets.map(r => [r.name, r])
      ).values()
    ];

    el.rocketContainer.innerHTML = "";

    uniqueRockets.slice(0, 8).forEach(r => {

      el.rocketContainer.innerHTML += `
      <div class="small-card">

        <img
          src="${r.image_url || 'https://via.placeholder.com/400x250'}"
          alt="${r.name || 'Rocket'}"
          onerror="this.src='https://via.placeholder.com/400x250'"
        >

        <h3>${r.name || "Unknown Rocket"}</h3>

        <p>
          <strong>Family:</strong>
          ${r.family || "N/A"}
        </p>

        <p>
          <strong>Variant:</strong>
          ${r.variant || "N/A"}
        </p>

        <p>
          <strong>Full Name:</strong>
          ${r.full_name || "N/A"}
        </p>

      </div>`;
    });

  } catch (err) {
    console.error(err);

    el.rocketContainer.innerHTML =
      "<p>⚠ Unable to Load Rockets</p>";
  }
}
async function fetchNews(){
if(!el.newsContainer)return;
try{
el.newsContainer.innerHTML=
"<p>Loading News...</p>";
const data=await(
await fetch(
"https://api.spaceflightnewsapi.net/v4/articles/?limit=6"
)
).json();
el.newsContainer.innerHTML="";
data.results.forEach(n=>{
el.newsContainer.innerHTML+=`
<div class="small-card">
<img
src="${n.image_url}"
onerror="this.src='https://via.placeholder.com/400x250'">
<h3>${n.title}</h3>
<p>
${(n.summary||"No summary").slice(0,120)}...
</p>
<a href="${n.url}"
target="_blank"
rel="noopener noreferrer">
Read More →
</a>
</div>`;
});
}catch{
el.newsContainer.innerHTML=
"<p>⚠ Unable to Load News</p>";
}
}
el.searchInput?.addEventListener("input",e=>{
const value=e.target.value.toLowerCase();
renderLaunches(
launches.filter(l=>
(l.name||"")
.toLowerCase()
.includes(value)
)
);
});
["upcoming","previous"].forEach(type=>{
$(type+"Btn")?.addEventListener("click",()=>{
el.upcomingBtn.classList.toggle(
"active",
type==="upcoming"
);
el.previousBtn.classList.toggle(
"active",
type==="previous"
);
fetchLaunches(type);
});
});
el.themeToggle?.addEventListener("click",()=>{
document.body.classList.toggle("light");
el.themeToggle.textContent=
document.body.classList.contains("light")
?"☀️":"🌙";
});
el.closeModal.onclick=()=>
el.modal.style.display="none";
window.onclick=e=>{
if(e.target===el.modal)
el.modal.style.display="none";
};
setInterval(()=>{
el.utcClock.textContent=
new Date().toUTCString();
el.localClock.textContent=
new Date().toLocaleString();
},1000);
fetchLaunches();
fetchRockets();
fetchNews();
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("show");
});