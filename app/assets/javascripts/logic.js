Backbone.Model.prototype.idAttribute = "_id";

_.templateSettings = {
    interpolate: /\{\{\=(.+?)\}\}/g,
    evaluate: /\{\{(.+?)\}\}/g
};

var userCoupons;
var userFriends;
var userCouponsHash = {};
var userFriendsHash = {};
var scrollAvailable = {};
var scrollUsed = {};

var Coupon = Backbone.Model.extend({
    url: function() {
	var base = 'coupons';
	if(this.isNew()) return base;
	return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
    }
});

var Friend = Backbone.Model.extend({
    url: function() {
	var base = 'friends';
	if(this.isNew()) return base;
	return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
    }
});

var Coupons = Backbone.Collection.extend({
    model: Coupon,
    url: function() {
	base_url = '/coupons';
	if(this.uid != null) 
	    base_url += '?uid='+this.uid;
	return base_url;
    },
    initialize: function(uid) {
	this.uid = uid;
    },
    setUid: function(uid) {
	this.uid = uid;
    }
});

var Friends = Backbone.Collection.extend({
    model: Friend,
    url: function() {
	base_url = '/friends';
	if(this.uid != null) 
	    base_url += '?uid='+this.uid;
	return base_url;
    },
    initialize: function(uid) {
	this.uid = uid;
    },
    setUid: function(uid) {
	this.uid = uid;
    }
});	    	    

var load = function() {
    ele_show("loading");
    userCoupons = new Coupons(uid);
    userCoupons.setUid(uid);
    userCoupons.fetch({
	success: function() {
	    ele_hide("loading");
	    updateCoupons();
	    prepareCouponsView();
	},         
	error: function() {
	}
    });
    
    userFriends = new Friends(uid);
    userFriends.setUid(uid);
    userFriends.fetch({
	success: function() {
	    updateFriends();
	    prepareFriendsView();
	},         
	error: function() {
	}
    });
};

function updateCoupons() {
    if(userCoupons.length > 0) {
		userCouponsHash = {};
		userUsedCouponsHash = {};
		userCoupons.each(function(obj) {
			// console.log(obj.get("status"));
		    if(obj.get("status") == 0){
		    	userCouponsHash[obj.get("_id")] = obj;	
		    } else {
		    	userUsedCouponsHash[obj.get("_id")] = obj;	
		    }	    
		});
    }
}

function getFriendsCoupons(uid){
	friendCouponsHash = {};
	if(userCoupons.length > 0) {		
		userCoupons.each(function(obj){
			if (obj.get("fb_id") == uid){
				friendCouponsHash[uid] = obj;
			}
		});
	}
	return friendCouponsHash;
}

function updateFriends() {
    if(userFriends.length > 0) {
	userFriendsHash = {};
	userFriends.each(function(obj) {
	    f_data = getFriendsCoupons(obj.get("friend_fb_id"));
	    if(!jQuery.isEmptyObject(f_data)){
	    	userFriendsHash[obj.get("_id")] = obj;
	    }
	});
    }
}

function prepareFriendsView() {
    var friendsIds = get_hash_keys(userFriendsHash);    
    if(friendsIds.length > 0) {
	var html = "";
	for(var i=0;i<friendsIds.length;i++) {
	    var friendObj = userFriendsHash[friendsIds[i]];
	    if((friendsIds != null) && (friendObj != null)) {
		var pic_url = "http://graph.facebook.com/"+friendObj.get("friend_fb_id")+"/picture?width=125&height=125";
		var variable = { id : friendObj.get("_id"), pic_url : pic_url, user_id: friendObj.get("friend_fb_id"), name: friendObj.get("name") };
		html += _.template($("#userIcon").html(), variable);		    
	    }
	}
	ele("friends-area").innerHTML = html;
    }
}

function prepareCouponsView() {
    var coupons = get_hash_keys(userCouponsHash);
    var html = "";
    if (coupons.length > 0){
	var inner_html = "";
	var html = "";
	for(var cpn=0;cpn < coupons.length; cpn++){
	    var couponObj = userCouponsHash[coupons[cpn]];
	    if (couponObj != null){
	    var date = getDate(couponObj.get("expire_at"));
		var variable = {id: couponObj.get("_id"), vendor: getVendorName(couponObj.get("coupon_vendor")), code: couponObj.get("code"), exp_at: date, status: couponObj.get("status"), user_id: couponObj.get("fb_id"), user_name: couponObj.get("user_name")}
		inner_html += _.template($("#individual_coupon").html(), variable);		    
	    }
	}
	variable = {html: inner_html}
	html = _.template($("#coupon_display").html(), variable)		
    }
    ele("coupon-code-feed").innerHTML = html;
    // if (!jQuery.isEmptyObject(scrollAvailable)){
	    scrollAvailable = new GridScrollFx( document.getElementById( 'grid' ), {
			viewportFactor : 0.4
		} );    
	// }
}

function prepareUsedCouponsView(){
	var coupons = get_hash_keys(userUsedCouponsHash);
    var html = "";
    if (coupons.length > 0){
	var inner_html = "";
	var html = "";
	for(var cpn=0;cpn < coupons.length; cpn++){
	    var couponObj = userUsedCouponsHash[coupons[cpn]];
	    if (couponObj != null){
	    var date = getDate(couponObj.get("expire_at"));
		var variable = {id: couponObj.get("_id"), vendor: getVendorName(couponObj.get("coupon_vendor")), code: couponObj.get("code"), exp_at: date, status: couponObj.get("status"), user_id: couponObj.get("fb_id")}
		inner_html += _.template($("#individual_used_coupon").html(), variable);		    
	    }
	}
	variable = {html: inner_html}
	html = _.template($("#coupon_used_display").html(), variable)		
    }
    ele("coupon-used-code-feed").innerHTML = html;
    // if (!jQuery.isEmptyObject(scrollUsed)){
	    scrollUsed = new GridScrollFx( document.getElementById( 'grid_used' ), {
			viewportFactor : 0.4
		} );  
	// }
}

function getDate(date){
	return $.timeago(date).split(" ago")[0];
}

function getFriendCouponData(user_id){
    var coupons = get_hash_keys(userCouponsHash);
    if (coupons.length > 0){
	var inner_html = "";
	var html = "";
	for(var cpn=0;cpn < coupons.length; cpn++){
	    var couponObj = userCouponsHash[coupons[cpn]];
	    if (couponObj != null && couponObj.get("fb_id") == user_id){
		    var date = getDate(couponObj.get("expire_at"));
		var variable = {id: couponObj.get("_id"), vendor: getVendorName(couponObj.get("coupon_vendor")), code: couponObj.get("code"), exp_at: date, status: couponObj.get("status"), user_id: couponObj.get("fb_id"), user_name: couponObj.get("user_name")}
			inner_html += _.template($("#individual_coupon").html(), variable);		    
	    }
	}
	variable = {html: inner_html}
	html = _.template($("#coupon_display").html(), variable)		
    }
    ele("coupon-code-feed").innerHTML = html;
    new GridScrollFx( document.getElementById( 'grid' ), {
	viewportFactor : 0.4
    } ); 
}

function getTypeCouponData(type){
	var coupons = get_hash_keys(userCouponsHash);
    if (coupons.length > 0){
	var inner_html = "";
	var html = "";
	for(var cpn=0;cpn < coupons.length; cpn++){
	    var couponObj = userCouponsHash[coupons[cpn]];
	    if (couponObj != null && couponObj.get("coupon_vendor") == type){
		    var date = getDate(couponObj.get("expire_at"));
		var variable = {id: couponObj.get("_id"), vendor: getVendorName(couponObj.get("coupon_vendor")), code: couponObj.get("code"), exp_at: date, status: couponObj.get("status"), user_id: couponObj.get("fb_id"), user_name: couponObj.get("user_name")}
			inner_html += _.template($("#individual_coupon").html(), variable);		    
	    }
	}
	variable = {html: inner_html}
	html = _.template($("#coupon_display").html(), variable)		
    }
    ele("coupon-code-feed").innerHTML = html;
    new GridScrollFx( document.getElementById( 'grid' ), {
	viewportFactor : 0.4
    } ); 
}

function removeFriend(id) {
    friendObj = userFriendsHash[id];
    friendObj.set({status: -100});
    userFriendsHash[id] = null;
    prepareFriendsView();
    friendObj.save({}, {
	success: function(response) {
	}, 
	error: function(response) {
	}
    });
}

function selectVendor(id) {
    ele("vendor-name").innerHTML = getVendorName(id);
    ele("vendor-id").value = id;
}

function getVendorName(id) {
    var vendor = {
	10: "Myntra",
	20: "Snapdeal",
	30: "Cafe Coffee Day",
	40: "KFC"
    }
    return vendor[id]
}

function addNewCoupon() {
    var coupon = new Coupon();
    var vendor_id = ele("vendor-id").value;
    var expire_at = ele("coupon-exp-date").value;
    var code = ele("coupon-code").value;    
    var desc = ele("coupon-desc").value;    
    var error = false;
    if((vendor_id == null) || (vendor_id.length == 0)) {
	error = true;
	$("#coupVendor").removeClass("btn-primary");
	$("#coupVendor").addClass("btn-danger");
    } else {
	$("#coupVendor").removeClass("btn-danger");
	$("#coupVendor").addClass("btn-primary");
    }
    if((code == null) || (code.length == 0)) {
	error = true;
	$("#coupon-code-div").addClass("has-error");
    } else {
	$("#coupon-code-div").removeClass("has-error");
    }
    if((expire_at == null) || (expire_at.length == 0)) {
	error = true;
	$("#coupon-exp-div").addClass("has-error");
    } else {
	$("#coupon-exp-div").removeClass("has-error");
    }
    if(!error) {
	coupon.set({
	    coupon_vendor: vendor_id,
	    expire_at: expire_at,
	    code: code,
	    desc: desc
	});    
	coupon.save({}, {
	    success: function(model, response) {
		ele("coupon-exp-date").value = "";
		ele("coupon-code").value = "";
		userCoupons.push(model);
		updateCoupons();
		prepareCouponsView();
	    }, 
	    error: function(response) {
	    }
	});
    }
}

function updateCode(code, id){
    codedata = code.data("grabdata");
    code.text(codedata);    
    var coupon = userCouponsHash[id];
    console.log(id);
    code.removeClass("btn-success").addClass("btn-inverse");
    coupon.set({status: -100});
    coupon.save({}, {
	success: function(model, response) {
	    $("#"+codedata).delay("3000").fadeTo( "fast", 0.33 );
	    $("#"+codedata+" h3").delay("5000");	    
	}, 
	error: function(response) {
	}
    })
}

function showUserFeeds(obj){
	user_id = obj.data("id");
	$("#user_id_data").text(obj.data("name"));
	$("#user_only_id .fui-cross-circle").show();
	getFriendCouponData(user_id);
}

function removeFilter(){
	$("#user_only_id .fui-cross-circle").hide();
	$("#user_id_data").text("All Coupons");
	prepareCouponsView();
	$(".coupon-type").removeClass("btn-inverse").addClass("btn-info");
}

function addTypeFilter(type, obj){
	getTypeCouponData(type);
	$(".coupon-type").removeClass("btn-info").addClass("btn-inverse");
	obj.removeClass("btn-inverse").addClass("btn-info");
}

function showAvailableCoupons(){
	$(".coupon-display").hide();
	$("#show_active").addClass("active");
	$("#show_inactive").removeClass("active");
	$("#coupon-code-feed").show();
	prepareCouponsView();
}

function showUsedCoupons(){
	$(".coupon-display").hide();
	$("#show_active").removeClass("active");
	$("#show_inactive").addClass("active");
	$("#coupon-used-code-feed").show();	
	prepareUsedCouponsView();
}