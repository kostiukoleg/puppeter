function allCheck() {
	return alert('Working');
    const F = document.forms[0];
    for (let i = 0;i< F.elements.length; i++){
        if((F.elements[i].name.indexOf("downl") == 0 ) && (F.elements[i].type.toLowerCase() == "checkbox")){
           return F.elements[i].checked = true;
        }
    }
}
var href = document.location.href;

// Google 
if (!(/\.(js|css|xml|rss|pdf)$/.test(href)) && ( /^http[s]?:\/\/[^.]*\.(worktool.vifp)\.[a-z\.]+\//.test(href) )) {
	allCheck();
}
