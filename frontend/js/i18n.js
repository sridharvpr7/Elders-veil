(function(){
  const KEY='elder-veil-language';
  const dict={
    en:{
      home:'Home',comics:'Comics',genres:'Genres',popular:'Popular',latest:'Latest',
      signIn:'Sign In',register:'Register',dashboard:'Dashboard',bookmarks:'Bookmarks',favorites:'Favorites',
      history:'Reading History',notifications:'Notifications',profile:'Profile Settings',premium:'Premium',
      creatorStudio:'Creator Studio',uploadComic:'Upload Comic',adminPortal:'Admin Portal',logout:'Logout',
      searchPlaceholder:'Search title, author, genre...',support:'Support',privacy:'Privacy Policy',terms:'Terms of Service',
      discovery:'Discovery',account:'User Account',platform:'Platform',allComics:'All Comics',browseGenres:'Browse Genres',
      mostPopular:'Most Popular',latestReleases:'Latest Releases',myBookmarks:'My Bookmarks',readingProgress:'Reading Progress',
      exploreAll:'Explore All Comics',search:'Search',genre:'Genre',allGenres:'All Genres',type:'Type',allTypes:'All Types',
      sortBy:'Sort By',latestUpdated:'Latest Updated',mostViews:'Most Views',topRated:'Top Rated',titleAZ:'Title A-Z',
      tamil:'தமிழ்',english:'English',language:'Language',creator:'Creator',follow:'Follow Creator',following:'Following',
      recommended:'Recommended For You',trending:'Trending Releases',continueReading:'Continue Reading',resume:'Resume',
      popularGenres:'Popular Genres',exploreCatalog:'Explore Catalog',noComics:'No comics match your criteria',
      adjustFilters:'Try adjusting your filters or search keywords.',comicSearch:'Comic Search Engine',
      searchHelp:'Type title, author, artist, or genre...',noNotifications:'No notifications yet.',
      savePreferences:'Save Preferences',newComicWhatsApp:'New comic WhatsApp',newChapterWhatsApp:'New chapter WhatsApp',
      inApp:'In-app notifications',premiumActive:'Premium active',notActive:'Not active',buyPremium:'Buy 1 Month Premium',
      publish:'Publish',requestChanges:'Request Changes',reject:'Reject',approve:'Approve'
    },
    ta:{
      home:'முகப்பு',comics:'காமிக்ஸ்',genres:'வகைகள்',popular:'பிரபலமானவை',latest:'புதியவை',
      signIn:'உள்நுழை',register:'பதிவு செய்ய',dashboard:'டாஷ்போர்டு',bookmarks:'புக்மார்க்ஸ்',favorites:'விருப்பங்கள்',
      history:'வாசிப்பு வரலாறு',notifications:'அறிவிப்புகள்',profile:'சுயவிவர அமைப்புகள்',premium:'பிரீமியம்',
      creatorStudio:'கிரியேட்டர் ஸ்டூடியோ',uploadComic:'காமிக்ஸ் பதிவேற்றம்',adminPortal:'நிர்வாக போர்டல்',logout:'வெளியேறு',
      searchPlaceholder:'தலைப்பு, ஆசிரியர், வகை தேடவும்...',support:'ஆதரவு',privacy:'தனியுரிமை',terms:'விதிமுறைகள்',
      discovery:'தேடல்',account:'பயனர் கணக்கு',platform:'தளம்',allComics:'அனைத்து காமிக்ஸ்கள்',browseGenres:'வகைகளை பார்க்க',
      mostPopular:'மிகவும் பிரபலமானவை',latestReleases:'சமீபத்திய வெளியீடுகள்',myBookmarks:'என் புக்மார்க்ஸ்',readingProgress:'வாசிப்பு முன்னேற்றம்',
      exploreAll:'அனைத்து காமிக்ஸ்களையும் பார்க்க',search:'தேடல்',genre:'வகை',allGenres:'அனைத்து வகைகள்',type:'வகைமை',allTypes:'அனைத்து வகைமைகள்',
      sortBy:'வரிசைப்படுத்து',latestUpdated:'சமீபத்திய மாற்றம்',mostViews:'அதிக பார்வைகள்',topRated:'சிறந்த மதிப்பீடு',titleAZ:'தலைப்பு A-Z',
      tamil:'தமிழ்',english:'English',language:'மொழி',creator:'கிரியேட்டர்',follow:'கிரியேட்டரை பின்தொடர்',following:'பின்தொடர்கிறீர்கள்',
      recommended:'உங்களுக்கான பரிந்துரைகள்',trending:'ட்ரெண்டிங் வெளியீடுகள்',continueReading:'தொடர்ந்து படிக்க',resume:'தொடர்',
      popularGenres:'பிரபலமான வகைகள்',exploreCatalog:'கேட்டலாக் பார்க்க',noComics:'உங்கள் தேடலுக்கு ஏற்ற காமிக்ஸ் இல்லை',
      adjustFilters:'வடிகட்டிகளை அல்லது தேடல் சொற்களை மாற்றிப் பாருங்கள்.',comicSearch:'காமிக்ஸ் தேடுபொறி',
      searchHelp:'தலைப்பு, ஆசிரியர், ஆர்டிஸ்ட் அல்லது வகையை உள்ளிடவும்...',noNotifications:'இன்னும் அறிவிப்புகள் இல்லை.',
      savePreferences:'விருப்பங்களை சேமி',newComicWhatsApp:'புதிய காமிக்ஸ் WhatsApp',newChapterWhatsApp:'புதிய அத்தியாயம் WhatsApp',
      inApp:'உள்ளமை அறிவிப்புகள்',premiumActive:'பிரீமியம் செயலில் உள்ளது',notActive:'செயலில் இல்லை',buyPremium:'1 மாத பிரீமியம் வாங்க',
      publish:'வெளியிடு',requestChanges:'மாற்றங்கள் கோர்',reject:'நிராகரி',approve:'அனுமதி'
    }
  };
  function get(){const v=localStorage.getItem(KEY);return v==='ta'?'ta':'en';}
  function sitePath(path=''){
    const clean=String(path).replace(/^\/+/, '');
    const parts=location.pathname.split('/').filter(Boolean);
    const github=location.hostname.endsWith('github.io');
    const base=github && parts.length ? `/${parts[0]}/` : '/';
    return base + clean;
  }
  function set(lang){const l=lang==='ta'?'ta':'en';localStorage.setItem(KEY,l);document.documentElement.lang=l;apply();document.dispatchEvent(new CustomEvent('ev-language-change',{detail:{lang:l}}));}
  function t(key,fallback){return dict[get()]?.[key]??dict.en?.[key]??fallback??key;}
  function apply(root=document){
    root.querySelectorAll?.('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(key)el.textContent=t(key);});
    root.querySelectorAll?.('[data-i18n-placeholder]').forEach(el=>{el.placeholder=t(el.dataset.i18nPlaceholder);});
    root.querySelectorAll?.('[data-i18n-title]').forEach(el=>{el.title=t(el.dataset.i18nTitle);});
    const sel=root.querySelector?.('#language-select'); if(sel)sel.value=get();
  }
  window.sitePath=sitePath;
  window.I18N={get,set,t,apply,dict,sitePath};
  document.addEventListener('DOMContentLoaded',()=>{document.documentElement.lang=get();apply();});
})();
