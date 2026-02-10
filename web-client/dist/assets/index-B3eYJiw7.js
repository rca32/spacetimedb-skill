var zd=Object.defineProperty;var Vc=n=>{throw TypeError(n)};var Gd=(n,e,t)=>e in n?zd(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var le=(n,e,t)=>Gd(n,typeof e!="symbol"?e+"":e,t),Ta=(n,e,t)=>e.has(n)||Vc("Cannot "+t);var R=(n,e,t)=>(Ta(n,e,"read from private field"),t?t.call(n):e.get(n)),Ge=(n,e,t)=>e.has(n)?Vc("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(n):e.set(n,t),xe=(n,e,t,i)=>(Ta(n,e,"write to private field"),i?i.call(n,t):e.set(n,t),t),Ne=(n,e,t)=>(Ta(n,e,"access private method"),t);var zc=(n,e,t,i)=>({set _(s){xe(n,e,s,t)},get _(){return R(n,e,i)}});(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();function Hd(){let n=1;return{entities:new Map,nextEntityId(){const t=n;return n+=1,t}}}function Wd(){return{spacetimeUri:"ws://127.0.0.1:3000",spacetimeModuleName:"stitch-server",logLevel:"info",tokenStorageKey:"stitch-web-token"}}const Gc={debug:10,info:20,warn:30,error:40};function qd(n){const e=i=>Gc[i]>=Gc[n],t=(i,s,a)=>{if(!e(i))return;const o=a?{...a}:void 0,c=`[${i.toUpperCase()}]`;if(i==="error"){console.error(c,s,o??"");return}if(i==="warn"){console.warn(c,s,o??"");return}console.info(c,s,o??"")};return{debug:(i,s)=>t("debug",i,s),info:(i,s)=>t("info",i,s),warn:(i,s)=>t("warn",i,s),error:(i,s)=>t("error",i,s)}}class Kd{constructor(e){this.storageKey=e}load(){return localStorage.getItem(this.storageKey)}save(e){localStorage.setItem(this.storageKey,e)}clear(){localStorage.removeItem(this.storageKey)}}/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const _c="182",Xd=0,Hc=1,jd=2,Js=1,Yd=2,ns=3,ii=0,Yt=1,Nn=2,On=0,wr=1,Wc=2,qc=3,Kc=4,$d=5,Ai=100,Zd=101,Jd=102,Qd=103,eh=104,th=200,nh=201,ih=202,rh=203,so=204,ao=205,sh=206,ah=207,oh=208,ch=209,lh=210,uh=211,dh=212,hh=213,fh=214,oo=0,co=1,lo=2,Lr=3,uo=4,ho=5,fo=6,po=7,gu=0,ph=1,mh=2,Sn=0,yu=1,xu=2,vu=3,Su=4,bu=5,Mu=6,wu=7,Eu=300,Oi=301,Nr=302,mo=303,_o=304,ya=306,go=1e3,Fn=1001,yo=1002,Bt=1003,_h=1004,Ps=1005,Vt=1006,Aa=1007,Ci=1008,en=1009,Tu=1010,Au=1011,cs=1012,gc=1013,wn=1014,xn=1015,zn=1016,yc=1017,xc=1018,ls=1020,Iu=35902,Ru=35899,Cu=1021,Pu=1022,fn=1023,Gn=1026,Pi=1027,Uu=1028,vc=1029,Fr=1030,Sc=1031,bc=1033,Qs=33776,ea=33777,ta=33778,na=33779,xo=35840,vo=35841,So=35842,bo=35843,Mo=36196,wo=37492,Eo=37496,To=37488,Ao=37489,Io=37490,Ro=37491,Co=37808,Po=37809,Uo=37810,Do=37811,Lo=37812,No=37813,Fo=37814,Bo=37815,Oo=37816,ko=37817,Vo=37818,zo=37819,Go=37820,Ho=37821,Wo=36492,qo=36494,Ko=36495,Xo=36283,jo=36284,Yo=36285,$o=36286,gh=3200,Du=0,yh=1,Zn="",an="srgb",Br="srgb-linear",sa="linear",ft="srgb",Vi=7680,Xc=519,xh=512,vh=513,Sh=514,Mc=515,bh=516,Mh=517,wc=518,wh=519,jc=35044,Yc="300 es",vn=2e3,aa=2001;function Lu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function oa(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function Eh(){const n=oa("canvas");return n.style.display="block",n}const $c={};function Zc(...n){const e="THREE."+n.shift();console.log(e,...n)}function Ve(...n){const e="THREE."+n.shift();console.warn(e,...n)}function nt(...n){const e="THREE."+n.shift();console.error(e,...n)}function us(...n){const e=n.join(" ");e in $c||($c[e]=!0,Ve(...n))}function Th(n,e,t){return new Promise(function(i,s){function a(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(a,t);break;default:i()}}setTimeout(a,t)})}class zr{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const s=i[e];if(s!==void 0){const a=s.indexOf(t);a!==-1&&s.splice(a,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const s=i.slice(0);for(let a=0,o=s.length;a<o;a++)s[a].call(this,e);e.target=null}}}const Ot=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Ia=Math.PI/180,Zo=180/Math.PI;function Ms(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ot[n&255]+Ot[n>>8&255]+Ot[n>>16&255]+Ot[n>>24&255]+"-"+Ot[e&255]+Ot[e>>8&255]+"-"+Ot[e>>16&15|64]+Ot[e>>24&255]+"-"+Ot[t&63|128]+Ot[t>>8&255]+"-"+Ot[t>>16&255]+Ot[t>>24&255]+Ot[i&255]+Ot[i>>8&255]+Ot[i>>16&255]+Ot[i>>24&255]).toLowerCase()}function Ze(n,e,t){return Math.max(e,Math.min(t,n))}function Ah(n,e){return(n%e+e)%e}function Ra(n,e,t){return(1-t)*n+t*e}function qr(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Xt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}class at{constructor(e=0,t=0){at.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),s=Math.sin(t),a=this.x-e.x,o=this.y-e.y;return this.x=a*i-o*s+e.x,this.y=a*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class ws{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,a,o,c){let l=i[s+0],u=i[s+1],d=i[s+2],f=i[s+3],p=a[o+0],m=a[o+1],y=a[o+2],v=a[o+3];if(c<=0){e[t+0]=l,e[t+1]=u,e[t+2]=d,e[t+3]=f;return}if(c>=1){e[t+0]=p,e[t+1]=m,e[t+2]=y,e[t+3]=v;return}if(f!==v||l!==p||u!==m||d!==y){let _=l*p+u*m+d*y+f*v;_<0&&(p=-p,m=-m,y=-y,v=-v,_=-_);let h=1-c;if(_<.9995){const w=Math.acos(_),T=Math.sin(w);h=Math.sin(h*w)/T,c=Math.sin(c*w)/T,l=l*h+p*c,u=u*h+m*c,d=d*h+y*c,f=f*h+v*c}else{l=l*h+p*c,u=u*h+m*c,d=d*h+y*c,f=f*h+v*c;const w=1/Math.sqrt(l*l+u*u+d*d+f*f);l*=w,u*=w,d*=w,f*=w}}e[t]=l,e[t+1]=u,e[t+2]=d,e[t+3]=f}static multiplyQuaternionsFlat(e,t,i,s,a,o){const c=i[s],l=i[s+1],u=i[s+2],d=i[s+3],f=a[o],p=a[o+1],m=a[o+2],y=a[o+3];return e[t]=c*y+d*f+l*m-u*p,e[t+1]=l*y+d*p+u*f-c*m,e[t+2]=u*y+d*m+c*p-l*f,e[t+3]=d*y-c*f-l*p-u*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,s=e._y,a=e._z,o=e._order,c=Math.cos,l=Math.sin,u=c(i/2),d=c(s/2),f=c(a/2),p=l(i/2),m=l(s/2),y=l(a/2);switch(o){case"XYZ":this._x=p*d*f+u*m*y,this._y=u*m*f-p*d*y,this._z=u*d*y+p*m*f,this._w=u*d*f-p*m*y;break;case"YXZ":this._x=p*d*f+u*m*y,this._y=u*m*f-p*d*y,this._z=u*d*y-p*m*f,this._w=u*d*f+p*m*y;break;case"ZXY":this._x=p*d*f-u*m*y,this._y=u*m*f+p*d*y,this._z=u*d*y+p*m*f,this._w=u*d*f-p*m*y;break;case"ZYX":this._x=p*d*f-u*m*y,this._y=u*m*f+p*d*y,this._z=u*d*y-p*m*f,this._w=u*d*f+p*m*y;break;case"YZX":this._x=p*d*f+u*m*y,this._y=u*m*f+p*d*y,this._z=u*d*y-p*m*f,this._w=u*d*f-p*m*y;break;case"XZY":this._x=p*d*f-u*m*y,this._y=u*m*f-p*d*y,this._z=u*d*y+p*m*f,this._w=u*d*f+p*m*y;break;default:Ve("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],s=t[4],a=t[8],o=t[1],c=t[5],l=t[9],u=t[2],d=t[6],f=t[10],p=i+c+f;if(p>0){const m=.5/Math.sqrt(p+1);this._w=.25/m,this._x=(d-l)*m,this._y=(a-u)*m,this._z=(o-s)*m}else if(i>c&&i>f){const m=2*Math.sqrt(1+i-c-f);this._w=(d-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(a+u)/m}else if(c>f){const m=2*Math.sqrt(1+c-i-f);this._w=(a-u)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+d)/m}else{const m=2*Math.sqrt(1+f-i-c);this._w=(o-s)/m,this._x=(a+u)/m,this._y=(l+d)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ze(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,s=e._y,a=e._z,o=e._w,c=t._x,l=t._y,u=t._z,d=t._w;return this._x=i*d+o*c+s*u-a*l,this._y=s*d+o*l+a*c-i*u,this._z=a*d+o*u+i*l-s*c,this._w=o*d-i*c-s*l-a*u,this._onChangeCallback(),this}slerp(e,t){if(t<=0)return this;if(t>=1)return this.copy(e);let i=e._x,s=e._y,a=e._z,o=e._w,c=this.dot(e);c<0&&(i=-i,s=-s,a=-a,o=-o,c=-c);let l=1-t;if(c<.9995){const u=Math.acos(c),d=Math.sin(u);l=Math.sin(l*u)/d,t=Math.sin(t*u)/d,this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+a*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+a*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{constructor(e=0,t=0,i=0){O.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Jc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Jc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,s=this.z,a=e.elements;return this.x=a[0]*t+a[3]*i+a[6]*s,this.y=a[1]*t+a[4]*i+a[7]*s,this.z=a[2]*t+a[5]*i+a[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,s=this.z,a=e.elements,o=1/(a[3]*t+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*t+a[4]*i+a[8]*s+a[12])*o,this.y=(a[1]*t+a[5]*i+a[9]*s+a[13])*o,this.z=(a[2]*t+a[6]*i+a[10]*s+a[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,s=this.z,a=e.x,o=e.y,c=e.z,l=e.w,u=2*(o*s-c*i),d=2*(c*t-a*s),f=2*(a*i-o*t);return this.x=t+l*u+o*f-c*d,this.y=i+l*d+c*u-a*f,this.z=s+l*f+a*d-o*u,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,s=this.z,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*s,this.y=a[1]*t+a[5]*i+a[9]*s,this.z=a[2]*t+a[6]*i+a[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,s=e.y,a=e.z,o=t.x,c=t.y,l=t.z;return this.x=s*l-a*c,this.y=a*o-i*l,this.z=i*c-s*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ca.copy(this).projectOnVector(e),this.sub(Ca)}reflect(e){return this.sub(Ca.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(Ze(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Ca=new O,Jc=new ws;class He{constructor(e,t,i,s,a,o,c,l,u){He.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,a,o,c,l,u)}set(e,t,i,s,a,o,c,l,u){const d=this.elements;return d[0]=e,d[1]=s,d[2]=c,d[3]=t,d[4]=a,d[5]=l,d[6]=i,d[7]=o,d[8]=u,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,s=t.elements,a=this.elements,o=i[0],c=i[3],l=i[6],u=i[1],d=i[4],f=i[7],p=i[2],m=i[5],y=i[8],v=s[0],_=s[3],h=s[6],w=s[1],T=s[4],A=s[7],I=s[2],P=s[5],U=s[8];return a[0]=o*v+c*w+l*I,a[3]=o*_+c*T+l*P,a[6]=o*h+c*A+l*U,a[1]=u*v+d*w+f*I,a[4]=u*_+d*T+f*P,a[7]=u*h+d*A+f*U,a[2]=p*v+m*w+y*I,a[5]=p*_+m*T+y*P,a[8]=p*h+m*A+y*U,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],s=e[2],a=e[3],o=e[4],c=e[5],l=e[6],u=e[7],d=e[8];return t*o*d-t*c*u-i*a*d+i*c*l+s*a*u-s*o*l}invert(){const e=this.elements,t=e[0],i=e[1],s=e[2],a=e[3],o=e[4],c=e[5],l=e[6],u=e[7],d=e[8],f=d*o-c*u,p=c*l-d*a,m=u*a-o*l,y=t*f+i*p+s*m;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/y;return e[0]=f*v,e[1]=(s*u-d*i)*v,e[2]=(c*i-s*o)*v,e[3]=p*v,e[4]=(d*t-s*l)*v,e[5]=(s*a-c*t)*v,e[6]=m*v,e[7]=(i*l-u*t)*v,e[8]=(o*t-i*a)*v,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,a,o,c){const l=Math.cos(a),u=Math.sin(a);return this.set(i*l,i*u,-i*(l*o+u*c)+o+e,-s*u,s*l,-s*(-u*o+l*c)+c+t,0,0,1),this}scale(e,t){return this.premultiply(Pa.makeScale(e,t)),this}rotate(e){return this.premultiply(Pa.makeRotation(-e)),this}translate(e,t){return this.premultiply(Pa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Pa=new He,Qc=new He().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),el=new He().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ih(){const n={enabled:!0,workingColorSpace:Br,spaces:{},convert:function(s,a,o){return this.enabled===!1||a===o||!a||!o||(this.spaces[a].transfer===ft&&(s.r=kn(s.r),s.g=kn(s.g),s.b=kn(s.b)),this.spaces[a].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===ft&&(s.r=Er(s.r),s.g=Er(s.g),s.b=Er(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Zn?sa:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,o){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return us("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return us("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,a)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[Br]:{primaries:e,whitePoint:i,transfer:sa,toXYZ:Qc,fromXYZ:el,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:an},outputColorSpaceConfig:{drawingBufferColorSpace:an}},[an]:{primaries:e,whitePoint:i,transfer:ft,toXYZ:Qc,fromXYZ:el,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:an}}}),n}const Qe=Ih();function kn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Er(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let zi;class Rh{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{zi===void 0&&(zi=oa("canvas")),zi.width=e.width,zi.height=e.height;const s=zi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=zi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=oa("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const s=i.getImageData(0,0,e.width,e.height),a=s.data;for(let o=0;o<a.length;o++)a[o]=kn(a[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(kn(t[i]/255)*255):t[i]=kn(t[i]);return{data:t,width:e.width,height:e.height}}else return Ve("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Ch=0;class Ec{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ch++}),this.uuid=Ms(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let o=0,c=s.length;o<c;o++)s[o].isDataTexture?a.push(Ua(s[o].image)):a.push(Ua(s[o]))}else a=Ua(s);i.url=a}return t||(e.images[this.uuid]=i),i}}function Ua(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Rh.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ve("Texture: Unable to serialize Texture."),{})}let Ph=0;const Da=new O;class Wt extends zr{constructor(e=Wt.DEFAULT_IMAGE,t=Wt.DEFAULT_MAPPING,i=Fn,s=Fn,a=Vt,o=Ci,c=fn,l=en,u=Wt.DEFAULT_ANISOTROPY,d=Zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ph++}),this.uuid=Ms(),this.name="",this.source=new Ec(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=o,this.anisotropy=u,this.format=c,this.internalFormat=null,this.type=l,this.offset=new at(0,0),this.repeat=new at(1,1),this.center=new at(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new He,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=d,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Da).x}get height(){return this.source.getSize(Da).y}get depth(){return this.source.getSize(Da).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Ve(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Ve(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Eu)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case go:e.x=e.x-Math.floor(e.x);break;case Fn:e.x=e.x<0?0:1;break;case yo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case go:e.y=e.y-Math.floor(e.y);break;case Fn:e.y=e.y<0?0:1;break;case yo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Wt.DEFAULT_IMAGE=null;Wt.DEFAULT_MAPPING=Eu;Wt.DEFAULT_ANISOTROPY=1;class wt{constructor(e=0,t=0,i=0,s=1){wt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,s=this.z,a=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*a,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*a,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*a,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*a,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,a;const l=e.elements,u=l[0],d=l[4],f=l[8],p=l[1],m=l[5],y=l[9],v=l[2],_=l[6],h=l[10];if(Math.abs(d-p)<.01&&Math.abs(f-v)<.01&&Math.abs(y-_)<.01){if(Math.abs(d+p)<.1&&Math.abs(f+v)<.1&&Math.abs(y+_)<.1&&Math.abs(u+m+h-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(u+1)/2,A=(m+1)/2,I=(h+1)/2,P=(d+p)/4,U=(f+v)/4,V=(y+_)/4;return T>A&&T>I?T<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(T),s=P/i,a=U/i):A>I?A<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(A),i=P/s,a=V/s):I<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(I),i=U/a,s=V/a),this.set(i,s,a,t),this}let w=Math.sqrt((_-y)*(_-y)+(f-v)*(f-v)+(p-d)*(p-d));return Math.abs(w)<.001&&(w=1),this.x=(_-y)/w,this.y=(f-v)/w,this.z=(p-d)/w,this.w=Math.acos((u+m+h-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ze(this.x,e.x,t.x),this.y=Ze(this.y,e.y,t.y),this.z=Ze(this.z,e.z,t.z),this.w=Ze(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ze(this.x,e,t),this.y=Ze(this.y,e,t),this.z=Ze(this.z,e,t),this.w=Ze(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Ze(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Uh extends zr{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Vt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new wt(0,0,e,t),this.scissorTest=!1,this.viewport=new wt(0,0,e,t);const s={width:e,height:t,depth:i.depth},a=new Wt(s);this.textures=[];const o=i.count;for(let c=0;c<o;c++)this.textures[c]=a.clone(),this.textures[c].isRenderTargetTexture=!0,this.textures[c].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){const t={minFilter:Vt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ec(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class bn extends Uh{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class Nu extends Wt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Bt,this.minFilter=Bt,this.wrapR=Fn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Dh extends Wt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Bt,this.minFilter=Bt,this.wrapR=Fn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Es{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const a=i.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let o=0,c=a.count;o<c;o++)e.isMesh===!0?e.getVertexPosition(o,ln):ln.fromBufferAttribute(a,o),ln.applyMatrix4(e.matrixWorld),this.expandByPoint(ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Us.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Us.copy(i.boundingBox)),Us.applyMatrix4(e.matrixWorld),this.union(Us)}const s=e.children;for(let a=0,o=s.length;a<o;a++)this.expandByObject(s[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ln),ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Kr),Ds.subVectors(this.max,Kr),Gi.subVectors(e.a,Kr),Hi.subVectors(e.b,Kr),Wi.subVectors(e.c,Kr),Wn.subVectors(Hi,Gi),qn.subVectors(Wi,Hi),oi.subVectors(Gi,Wi);let t=[0,-Wn.z,Wn.y,0,-qn.z,qn.y,0,-oi.z,oi.y,Wn.z,0,-Wn.x,qn.z,0,-qn.x,oi.z,0,-oi.x,-Wn.y,Wn.x,0,-qn.y,qn.x,0,-oi.y,oi.x,0];return!La(t,Gi,Hi,Wi,Ds)||(t=[1,0,0,0,1,0,0,0,1],!La(t,Gi,Hi,Wi,Ds))?!1:(Ls.crossVectors(Wn,qn),t=[Ls.x,Ls.y,Ls.z],La(t,Gi,Hi,Wi,Ds))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Cn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Cn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Cn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Cn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Cn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Cn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Cn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Cn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Cn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Cn=[new O,new O,new O,new O,new O,new O,new O,new O],ln=new O,Us=new Es,Gi=new O,Hi=new O,Wi=new O,Wn=new O,qn=new O,oi=new O,Kr=new O,Ds=new O,Ls=new O,ci=new O;function La(n,e,t,i,s){for(let a=0,o=n.length-3;a<=o;a+=3){ci.fromArray(n,a);const c=s.x*Math.abs(ci.x)+s.y*Math.abs(ci.y)+s.z*Math.abs(ci.z),l=e.dot(ci),u=t.dot(ci),d=i.dot(ci);if(Math.max(-Math.max(l,u,d),Math.min(l,u,d))>c)return!1}return!0}const Lh=new Es,Xr=new O,Na=new O;class Tc{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Lh.setFromPoints(e).getCenter(i);let s=0;for(let a=0,o=e.length;a<o;a++)s=Math.max(s,i.distanceToSquared(e[a]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Xr.subVectors(e,this.center);const t=Xr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Xr,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Na.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Xr.copy(e.center).add(Na)),this.expandByPoint(Xr.copy(e.center).sub(Na))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}const Pn=new O,Fa=new O,Ns=new O,Kn=new O,Ba=new O,Fs=new O,Oa=new O;class Nh{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Pn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Pn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Pn.copy(this.origin).addScaledVector(this.direction,t),Pn.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Fa.copy(e).add(t).multiplyScalar(.5),Ns.copy(t).sub(e).normalize(),Kn.copy(this.origin).sub(Fa);const a=e.distanceTo(t)*.5,o=-this.direction.dot(Ns),c=Kn.dot(this.direction),l=-Kn.dot(Ns),u=Kn.lengthSq(),d=Math.abs(1-o*o);let f,p,m,y;if(d>0)if(f=o*l-c,p=o*c-l,y=a*d,f>=0)if(p>=-y)if(p<=y){const v=1/d;f*=v,p*=v,m=f*(f+o*p+2*c)+p*(o*f+p+2*l)+u}else p=a,f=Math.max(0,-(o*p+c)),m=-f*f+p*(p+2*l)+u;else p=-a,f=Math.max(0,-(o*p+c)),m=-f*f+p*(p+2*l)+u;else p<=-y?(f=Math.max(0,-(-o*a+c)),p=f>0?-a:Math.min(Math.max(-a,-l),a),m=-f*f+p*(p+2*l)+u):p<=y?(f=0,p=Math.min(Math.max(-a,-l),a),m=p*(p+2*l)+u):(f=Math.max(0,-(o*a+c)),p=f>0?a:Math.min(Math.max(-a,-l),a),m=-f*f+p*(p+2*l)+u);else p=o>0?-a:a,f=Math.max(0,-(o*p+c)),m=-f*f+p*(p+2*l)+u;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Fa).addScaledVector(Ns,p),m}intersectSphere(e,t){Pn.subVectors(e.center,this.origin);const i=Pn.dot(this.direction),s=Pn.dot(Pn)-i*i,a=e.radius*e.radius;if(s>a)return null;const o=Math.sqrt(a-s),c=i-o,l=i+o;return l<0?null:c<0?this.at(l,t):this.at(c,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,a,o,c,l;const u=1/this.direction.x,d=1/this.direction.y,f=1/this.direction.z,p=this.origin;return u>=0?(i=(e.min.x-p.x)*u,s=(e.max.x-p.x)*u):(i=(e.max.x-p.x)*u,s=(e.min.x-p.x)*u),d>=0?(a=(e.min.y-p.y)*d,o=(e.max.y-p.y)*d):(a=(e.max.y-p.y)*d,o=(e.min.y-p.y)*d),i>o||a>s||((a>i||isNaN(i))&&(i=a),(o<s||isNaN(s))&&(s=o),f>=0?(c=(e.min.z-p.z)*f,l=(e.max.z-p.z)*f):(c=(e.max.z-p.z)*f,l=(e.min.z-p.z)*f),i>l||c>s)||((c>i||i!==i)&&(i=c),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,Pn)!==null}intersectTriangle(e,t,i,s,a){Ba.subVectors(t,e),Fs.subVectors(i,e),Oa.crossVectors(Ba,Fs);let o=this.direction.dot(Oa),c;if(o>0){if(s)return null;c=1}else if(o<0)c=-1,o=-o;else return null;Kn.subVectors(this.origin,e);const l=c*this.direction.dot(Fs.crossVectors(Kn,Fs));if(l<0)return null;const u=c*this.direction.dot(Ba.cross(Kn));if(u<0||l+u>o)return null;const d=-c*Kn.dot(Oa);return d<0?null:this.at(d/o,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Et{constructor(e,t,i,s,a,o,c,l,u,d,f,p,m,y,v,_){Et.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,a,o,c,l,u,d,f,p,m,y,v,_)}set(e,t,i,s,a,o,c,l,u,d,f,p,m,y,v,_){const h=this.elements;return h[0]=e,h[4]=t,h[8]=i,h[12]=s,h[1]=a,h[5]=o,h[9]=c,h[13]=l,h[2]=u,h[6]=d,h[10]=f,h[14]=p,h[3]=m,h[7]=y,h[11]=v,h[15]=_,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Et().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();const t=this.elements,i=e.elements,s=1/qi.setFromMatrixColumn(e,0).length(),a=1/qi.setFromMatrixColumn(e,1).length(),o=1/qi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*a,t[5]=i[5]*a,t[6]=i[6]*a,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,s=e.y,a=e.z,o=Math.cos(i),c=Math.sin(i),l=Math.cos(s),u=Math.sin(s),d=Math.cos(a),f=Math.sin(a);if(e.order==="XYZ"){const p=o*d,m=o*f,y=c*d,v=c*f;t[0]=l*d,t[4]=-l*f,t[8]=u,t[1]=m+y*u,t[5]=p-v*u,t[9]=-c*l,t[2]=v-p*u,t[6]=y+m*u,t[10]=o*l}else if(e.order==="YXZ"){const p=l*d,m=l*f,y=u*d,v=u*f;t[0]=p+v*c,t[4]=y*c-m,t[8]=o*u,t[1]=o*f,t[5]=o*d,t[9]=-c,t[2]=m*c-y,t[6]=v+p*c,t[10]=o*l}else if(e.order==="ZXY"){const p=l*d,m=l*f,y=u*d,v=u*f;t[0]=p-v*c,t[4]=-o*f,t[8]=y+m*c,t[1]=m+y*c,t[5]=o*d,t[9]=v-p*c,t[2]=-o*u,t[6]=c,t[10]=o*l}else if(e.order==="ZYX"){const p=o*d,m=o*f,y=c*d,v=c*f;t[0]=l*d,t[4]=y*u-m,t[8]=p*u+v,t[1]=l*f,t[5]=v*u+p,t[9]=m*u-y,t[2]=-u,t[6]=c*l,t[10]=o*l}else if(e.order==="YZX"){const p=o*l,m=o*u,y=c*l,v=c*u;t[0]=l*d,t[4]=v-p*f,t[8]=y*f+m,t[1]=f,t[5]=o*d,t[9]=-c*d,t[2]=-u*d,t[6]=m*f+y,t[10]=p-v*f}else if(e.order==="XZY"){const p=o*l,m=o*u,y=c*l,v=c*u;t[0]=l*d,t[4]=-f,t[8]=u*d,t[1]=p*f+v,t[5]=o*d,t[9]=m*f-y,t[2]=y*f-m,t[6]=c*d,t[10]=v*f+p}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Fh,e,Bh)}lookAt(e,t,i){const s=this.elements;return Jt.subVectors(e,t),Jt.lengthSq()===0&&(Jt.z=1),Jt.normalize(),Xn.crossVectors(i,Jt),Xn.lengthSq()===0&&(Math.abs(i.z)===1?Jt.x+=1e-4:Jt.z+=1e-4,Jt.normalize(),Xn.crossVectors(i,Jt)),Xn.normalize(),Bs.crossVectors(Jt,Xn),s[0]=Xn.x,s[4]=Bs.x,s[8]=Jt.x,s[1]=Xn.y,s[5]=Bs.y,s[9]=Jt.y,s[2]=Xn.z,s[6]=Bs.z,s[10]=Jt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,s=t.elements,a=this.elements,o=i[0],c=i[4],l=i[8],u=i[12],d=i[1],f=i[5],p=i[9],m=i[13],y=i[2],v=i[6],_=i[10],h=i[14],w=i[3],T=i[7],A=i[11],I=i[15],P=s[0],U=s[4],V=s[8],S=s[12],b=s[1],L=s[5],q=s[9],H=s[13],J=s[2],Y=s[6],X=s[10],G=s[14],te=s[3],_e=s[7],he=s[11],ge=s[15];return a[0]=o*P+c*b+l*J+u*te,a[4]=o*U+c*L+l*Y+u*_e,a[8]=o*V+c*q+l*X+u*he,a[12]=o*S+c*H+l*G+u*ge,a[1]=d*P+f*b+p*J+m*te,a[5]=d*U+f*L+p*Y+m*_e,a[9]=d*V+f*q+p*X+m*he,a[13]=d*S+f*H+p*G+m*ge,a[2]=y*P+v*b+_*J+h*te,a[6]=y*U+v*L+_*Y+h*_e,a[10]=y*V+v*q+_*X+h*he,a[14]=y*S+v*H+_*G+h*ge,a[3]=w*P+T*b+A*J+I*te,a[7]=w*U+T*L+A*Y+I*_e,a[11]=w*V+T*q+A*X+I*he,a[15]=w*S+T*H+A*G+I*ge,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],s=e[8],a=e[12],o=e[1],c=e[5],l=e[9],u=e[13],d=e[2],f=e[6],p=e[10],m=e[14],y=e[3],v=e[7],_=e[11],h=e[15],w=l*m-u*p,T=c*m-u*f,A=c*p-l*f,I=o*m-u*d,P=o*p-l*d,U=o*f-c*d;return t*(v*w-_*T+h*A)-i*(y*w-_*I+h*P)+s*(y*T-v*I+h*U)-a*(y*A-v*P+_*U)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],s=e[2],a=e[3],o=e[4],c=e[5],l=e[6],u=e[7],d=e[8],f=e[9],p=e[10],m=e[11],y=e[12],v=e[13],_=e[14],h=e[15],w=f*_*u-v*p*u+v*l*m-c*_*m-f*l*h+c*p*h,T=y*p*u-d*_*u-y*l*m+o*_*m+d*l*h-o*p*h,A=d*v*u-y*f*u+y*c*m-o*v*m-d*c*h+o*f*h,I=y*f*l-d*v*l-y*c*p+o*v*p+d*c*_-o*f*_,P=t*w+i*T+s*A+a*I;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const U=1/P;return e[0]=w*U,e[1]=(v*p*a-f*_*a-v*s*m+i*_*m+f*s*h-i*p*h)*U,e[2]=(c*_*a-v*l*a+v*s*u-i*_*u-c*s*h+i*l*h)*U,e[3]=(f*l*a-c*p*a-f*s*u+i*p*u+c*s*m-i*l*m)*U,e[4]=T*U,e[5]=(d*_*a-y*p*a+y*s*m-t*_*m-d*s*h+t*p*h)*U,e[6]=(y*l*a-o*_*a-y*s*u+t*_*u+o*s*h-t*l*h)*U,e[7]=(o*p*a-d*l*a+d*s*u-t*p*u-o*s*m+t*l*m)*U,e[8]=A*U,e[9]=(y*f*a-d*v*a-y*i*m+t*v*m+d*i*h-t*f*h)*U,e[10]=(o*v*a-y*c*a+y*i*u-t*v*u-o*i*h+t*c*h)*U,e[11]=(d*c*a-o*f*a-d*i*u+t*f*u+o*i*m-t*c*m)*U,e[12]=I*U,e[13]=(d*v*s-y*f*s+y*i*p-t*v*p-d*i*_+t*f*_)*U,e[14]=(y*c*s-o*v*s-y*i*l+t*v*l+o*i*_-t*c*_)*U,e[15]=(o*f*s-d*c*s+d*i*l-t*f*l-o*i*p+t*c*p)*U,this}scale(e){const t=this.elements,i=e.x,s=e.y,a=e.z;return t[0]*=i,t[4]*=s,t[8]*=a,t[1]*=i,t[5]*=s,t[9]*=a,t[2]*=i,t[6]*=s,t[10]*=a,t[3]*=i,t[7]*=s,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),s=Math.sin(t),a=1-i,o=e.x,c=e.y,l=e.z,u=a*o,d=a*c;return this.set(u*o+i,u*c-s*l,u*l+s*c,0,u*c+s*l,d*c+i,d*l-s*o,0,u*l-s*c,d*l+s*o,a*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,a,o){return this.set(1,i,a,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){const s=this.elements,a=t._x,o=t._y,c=t._z,l=t._w,u=a+a,d=o+o,f=c+c,p=a*u,m=a*d,y=a*f,v=o*d,_=o*f,h=c*f,w=l*u,T=l*d,A=l*f,I=i.x,P=i.y,U=i.z;return s[0]=(1-(v+h))*I,s[1]=(m+A)*I,s[2]=(y-T)*I,s[3]=0,s[4]=(m-A)*P,s[5]=(1-(p+h))*P,s[6]=(_+w)*P,s[7]=0,s[8]=(y+T)*U,s[9]=(_-w)*U,s[10]=(1-(p+v))*U,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){const s=this.elements;if(e.x=s[12],e.y=s[13],e.z=s[14],this.determinant()===0)return i.set(1,1,1),t.identity(),this;let a=qi.set(s[0],s[1],s[2]).length();const o=qi.set(s[4],s[5],s[6]).length(),c=qi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(a=-a),un.copy(this);const u=1/a,d=1/o,f=1/c;return un.elements[0]*=u,un.elements[1]*=u,un.elements[2]*=u,un.elements[4]*=d,un.elements[5]*=d,un.elements[6]*=d,un.elements[8]*=f,un.elements[9]*=f,un.elements[10]*=f,t.setFromRotationMatrix(un),i.x=a,i.y=o,i.z=c,this}makePerspective(e,t,i,s,a,o,c=vn,l=!1){const u=this.elements,d=2*a/(t-e),f=2*a/(i-s),p=(t+e)/(t-e),m=(i+s)/(i-s);let y,v;if(l)y=a/(o-a),v=o*a/(o-a);else if(c===vn)y=-(o+a)/(o-a),v=-2*o*a/(o-a);else if(c===aa)y=-o/(o-a),v=-o*a/(o-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+c);return u[0]=d,u[4]=0,u[8]=p,u[12]=0,u[1]=0,u[5]=f,u[9]=m,u[13]=0,u[2]=0,u[6]=0,u[10]=y,u[14]=v,u[3]=0,u[7]=0,u[11]=-1,u[15]=0,this}makeOrthographic(e,t,i,s,a,o,c=vn,l=!1){const u=this.elements,d=2/(t-e),f=2/(i-s),p=-(t+e)/(t-e),m=-(i+s)/(i-s);let y,v;if(l)y=1/(o-a),v=o/(o-a);else if(c===vn)y=-2/(o-a),v=-(o+a)/(o-a);else if(c===aa)y=-1/(o-a),v=-a/(o-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+c);return u[0]=d,u[4]=0,u[8]=0,u[12]=p,u[1]=0,u[5]=f,u[9]=0,u[13]=m,u[2]=0,u[6]=0,u[10]=y,u[14]=v,u[3]=0,u[7]=0,u[11]=0,u[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const qi=new O,un=new Et,Fh=new O(0,0,0),Bh=new O(1,1,1),Xn=new O,Bs=new O,Jt=new O,tl=new Et,nl=new ws;class En{constructor(e=0,t=0,i=0,s=En.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const s=e.elements,a=s[0],o=s[4],c=s[8],l=s[1],u=s[5],d=s[9],f=s[2],p=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(Ze(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-d,m),this._z=Math.atan2(-o,a)):(this._x=Math.atan2(p,u),this._z=0);break;case"YXZ":this._x=Math.asin(-Ze(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(c,m),this._z=Math.atan2(l,u)):(this._y=Math.atan2(-f,a),this._z=0);break;case"ZXY":this._x=Math.asin(Ze(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-f,m),this._z=Math.atan2(-o,u)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Ze(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(p,m),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-o,u));break;case"YZX":this._z=Math.asin(Ze(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-d,u),this._y=Math.atan2(-f,a)):(this._x=0,this._y=Math.atan2(c,m));break;case"XZY":this._z=Math.asin(-Ze(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(p,u),this._y=Math.atan2(c,a)):(this._x=Math.atan2(-d,m),this._y=0);break;default:Ve("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return tl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(tl,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return nl.setFromEuler(this),this.setFromQuaternion(nl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}En.DEFAULT_ORDER="XYZ";class Fu{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Oh=0;const il=new O,Ki=new ws,Un=new Et,Os=new O,jr=new O,kh=new O,Vh=new ws,rl=new O(1,0,0),sl=new O(0,1,0),al=new O(0,0,1),ol={type:"added"},zh={type:"removed"},Xi={type:"childadded",child:null},ka={type:"childremoved",child:null};class zt extends zr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Oh++}),this.uuid=Ms(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=zt.DEFAULT_UP.clone();const e=new O,t=new En,i=new ws,s=new O(1,1,1);function a(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(a),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Et},normalMatrix:{value:new He}}),this.matrix=new Et,this.matrixWorld=new Et,this.matrixAutoUpdate=zt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=zt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Fu,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ki.setFromAxisAngle(e,t),this.quaternion.multiply(Ki),this}rotateOnWorldAxis(e,t){return Ki.setFromAxisAngle(e,t),this.quaternion.premultiply(Ki),this}rotateX(e){return this.rotateOnAxis(rl,e)}rotateY(e){return this.rotateOnAxis(sl,e)}rotateZ(e){return this.rotateOnAxis(al,e)}translateOnAxis(e,t){return il.copy(e).applyQuaternion(this.quaternion),this.position.add(il.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(rl,e)}translateY(e){return this.translateOnAxis(sl,e)}translateZ(e){return this.translateOnAxis(al,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Un.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Os.copy(e):Os.set(e,t,i);const s=this.parent;this.updateWorldMatrix(!0,!1),jr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Un.lookAt(jr,Os,this.up):Un.lookAt(Os,jr,this.up),this.quaternion.setFromRotationMatrix(Un),s&&(Un.extractRotation(s.matrixWorld),Ki.setFromRotationMatrix(Un),this.quaternion.premultiply(Ki.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(nt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(ol),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null):nt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(zh),ka.child=e,this.dispatchEvent(ka),ka.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Un.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Un.multiply(e.parent.matrixWorld)),e.applyMatrix4(Un),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(ol),Xi.child=e,this.dispatchEvent(Xi),Xi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(jr,e,kh),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(jr,Vh,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(c=>({...c,boundingBox:c.boundingBox?c.boundingBox.toJSON():void 0,boundingSphere:c.boundingSphere?c.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(c=>({...c})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(c,l){return c[l.uuid]===void 0&&(c[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(e.geometries,this.geometry);const c=this.geometry.parameters;if(c!==void 0&&c.shapes!==void 0){const l=c.shapes;if(Array.isArray(l))for(let u=0,d=l.length;u<d;u++){const f=l[u];a(e.shapes,f)}else a(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const c=[];for(let l=0,u=this.material.length;l<u;l++)c.push(a(e.materials,this.material[l]));s.material=c}else s.material=a(e.materials,this.material);if(this.children.length>0){s.children=[];for(let c=0;c<this.children.length;c++)s.children.push(this.children[c].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let c=0;c<this.animations.length;c++){const l=this.animations[c];s.animations.push(a(e.animations,l))}}if(t){const c=o(e.geometries),l=o(e.materials),u=o(e.textures),d=o(e.images),f=o(e.shapes),p=o(e.skeletons),m=o(e.animations),y=o(e.nodes);c.length>0&&(i.geometries=c),l.length>0&&(i.materials=l),u.length>0&&(i.textures=u),d.length>0&&(i.images=d),f.length>0&&(i.shapes=f),p.length>0&&(i.skeletons=p),m.length>0&&(i.animations=m),y.length>0&&(i.nodes=y)}return i.object=s,i;function o(c){const l=[];for(const u in c){const d=c[u];delete d.metadata,l.push(d)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const s=e.children[i];this.add(s.clone())}return this}}zt.DEFAULT_UP=new O(0,1,0);zt.DEFAULT_MATRIX_AUTO_UPDATE=!0;zt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const dn=new O,Dn=new O,Va=new O,Ln=new O,ji=new O,Yi=new O,cl=new O,za=new O,Ga=new O,Ha=new O,Wa=new wt,qa=new wt,Ka=new wt;class hn{constructor(e=new O,t=new O,i=new O){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),dn.subVectors(e,t),s.cross(dn);const a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(e,t,i,s,a){dn.subVectors(s,t),Dn.subVectors(i,t),Va.subVectors(e,t);const o=dn.dot(dn),c=dn.dot(Dn),l=dn.dot(Va),u=Dn.dot(Dn),d=Dn.dot(Va),f=o*u-c*c;if(f===0)return a.set(0,0,0),null;const p=1/f,m=(u*l-c*d)*p,y=(o*d-c*l)*p;return a.set(1-m-y,y,m)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,Ln)===null?!1:Ln.x>=0&&Ln.y>=0&&Ln.x+Ln.y<=1}static getInterpolation(e,t,i,s,a,o,c,l){return this.getBarycoord(e,t,i,s,Ln)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Ln.x),l.addScaledVector(o,Ln.y),l.addScaledVector(c,Ln.z),l)}static getInterpolatedAttribute(e,t,i,s,a,o){return Wa.setScalar(0),qa.setScalar(0),Ka.setScalar(0),Wa.fromBufferAttribute(e,t),qa.fromBufferAttribute(e,i),Ka.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Wa,a.x),o.addScaledVector(qa,a.y),o.addScaledVector(Ka,a.z),o}static isFrontFacing(e,t,i,s){return dn.subVectors(i,t),Dn.subVectors(e,t),dn.cross(Dn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return dn.subVectors(this.c,this.b),Dn.subVectors(this.a,this.b),dn.cross(Dn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return hn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return hn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,a){return hn.getInterpolation(e,this.a,this.b,this.c,t,i,s,a)}containsPoint(e){return hn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return hn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,s=this.b,a=this.c;let o,c;ji.subVectors(s,i),Yi.subVectors(a,i),za.subVectors(e,i);const l=ji.dot(za),u=Yi.dot(za);if(l<=0&&u<=0)return t.copy(i);Ga.subVectors(e,s);const d=ji.dot(Ga),f=Yi.dot(Ga);if(d>=0&&f<=d)return t.copy(s);const p=l*f-d*u;if(p<=0&&l>=0&&d<=0)return o=l/(l-d),t.copy(i).addScaledVector(ji,o);Ha.subVectors(e,a);const m=ji.dot(Ha),y=Yi.dot(Ha);if(y>=0&&m<=y)return t.copy(a);const v=m*u-l*y;if(v<=0&&u>=0&&y<=0)return c=u/(u-y),t.copy(i).addScaledVector(Yi,c);const _=d*y-m*f;if(_<=0&&f-d>=0&&m-y>=0)return cl.subVectors(a,s),c=(f-d)/(f-d+(m-y)),t.copy(s).addScaledVector(cl,c);const h=1/(_+v+p);return o=v*h,c=p*h,t.copy(i).addScaledVector(ji,o).addScaledVector(Yi,c)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Bu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},jn={h:0,s:0,l:0},ks={h:0,s:0,l:0};function Xa(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class it{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=an){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=i,Qe.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=Qe.workingColorSpace){if(e=Ah(e,1),t=Ze(t,0,1),i=Ze(i,0,1),t===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+t):i+t-i*t,o=2*i-a;this.r=Xa(o,a,e+1/3),this.g=Xa(o,a,e),this.b=Xa(o,a,e-1/3)}return Qe.colorSpaceToWorking(this,s),this}setStyle(e,t=an){function i(a){a!==void 0&&parseFloat(a)<1&&Ve("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const o=s[1],c=s[2];switch(o){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(c))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:Ve("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=s[1],o=a.length;if(o===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(a,16),t);Ve("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=an){const i=Bu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ve("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=kn(e.r),this.g=kn(e.g),this.b=kn(e.b),this}copyLinearToSRGB(e){return this.r=Er(e.r),this.g=Er(e.g),this.b=Er(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=an){return Qe.workingToColorSpace(kt.copy(this),e),Math.round(Ze(kt.r*255,0,255))*65536+Math.round(Ze(kt.g*255,0,255))*256+Math.round(Ze(kt.b*255,0,255))}getHexString(e=an){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.workingToColorSpace(kt.copy(this),t);const i=kt.r,s=kt.g,a=kt.b,o=Math.max(i,s,a),c=Math.min(i,s,a);let l,u;const d=(c+o)/2;if(c===o)l=0,u=0;else{const f=o-c;switch(u=d<=.5?f/(o+c):f/(2-o-c),o){case i:l=(s-a)/f+(s<a?6:0);break;case s:l=(a-i)/f+2;break;case a:l=(i-s)/f+4;break}l/=6}return e.h=l,e.s=u,e.l=d,e}getRGB(e,t=Qe.workingColorSpace){return Qe.workingToColorSpace(kt.copy(this),t),e.r=kt.r,e.g=kt.g,e.b=kt.b,e}getStyle(e=an){Qe.workingToColorSpace(kt.copy(this),e);const t=kt.r,i=kt.g,s=kt.b;return e!==an?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(jn),this.setHSL(jn.h+e,jn.s+t,jn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(jn),e.getHSL(ks);const i=Ra(jn.h,ks.h,t),s=Ra(jn.s,ks.s,t),a=Ra(jn.l,ks.l,t);return this.setHSL(i,s,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,s=this.b,a=e.elements;return this.r=a[0]*t+a[3]*i+a[6]*s,this.g=a[1]*t+a[4]*i+a[7]*s,this.b=a[2]*t+a[5]*i+a[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const kt=new it;it.NAMES=Bu;let Gh=0;class Ts extends zr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Gh++}),this.uuid=Ms(),this.name="",this.type="Material",this.blending=wr,this.side=ii,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=so,this.blendDst=ao,this.blendEquation=Ai,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new it(0,0,0),this.blendAlpha=0,this.depthFunc=Lr,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Xc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Vi,this.stencilZFail=Vi,this.stencilZPass=Vi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Ve(`Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){Ve(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==wr&&(i.blending=this.blending),this.side!==ii&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==so&&(i.blendSrc=this.blendSrc),this.blendDst!==ao&&(i.blendDst=this.blendDst),this.blendEquation!==Ai&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Lr&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Xc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Vi&&(i.stencilFail=this.stencilFail),this.stencilZFail!==Vi&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==Vi&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){const o=[];for(const c in a){const l=a[c];delete l.metadata,o.push(l)}return o}if(t){const a=s(e.textures),o=s(e.images);a.length>0&&(i.textures=a),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const s=t.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=t[a].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class Ou extends Ts{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new it(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.combine=gu,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Ct=new O,Vs=new at;let Hh=0;class Mn{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Hh++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=jc,this.updateRanges=[],this.gpuType=xn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Vs.fromBufferAttribute(this,t),Vs.applyMatrix3(e),this.setXY(t,Vs.x,Vs.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix3(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix4(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.applyNormalMatrix(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ct.fromBufferAttribute(this,t),Ct.transformDirection(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=qr(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Xt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=qr(t,this.array)),t}setX(e,t){return this.normalized&&(t=Xt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=qr(t,this.array)),t}setY(e,t){return this.normalized&&(t=Xt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=qr(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Xt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=qr(t,this.array)),t}setW(e,t){return this.normalized&&(t=Xt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Xt(t,this.array),i=Xt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=Xt(t,this.array),i=Xt(i,this.array),s=Xt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,a){return e*=this.itemSize,this.normalized&&(t=Xt(t,this.array),i=Xt(i,this.array),s=Xt(s,this.array),a=Xt(a,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==jc&&(e.usage=this.usage),e}}class ku extends Mn{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class Vu extends Mn{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class Vn extends Mn{constructor(e,t,i){super(new Float32Array(e),t,i)}}let Wh=0;const sn=new Et,ja=new zt,$i=new O,Qt=new Es,Yr=new Es,Nt=new O;class Hn extends zr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=Ms(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Lu(e)?Vu:ku)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new He().getNormalMatrix(e);i.applyNormalMatrix(a),i.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return sn.makeRotationFromQuaternion(e),this.applyMatrix4(sn),this}rotateX(e){return sn.makeRotationX(e),this.applyMatrix4(sn),this}rotateY(e){return sn.makeRotationY(e),this.applyMatrix4(sn),this}rotateZ(e){return sn.makeRotationZ(e),this.applyMatrix4(sn),this}translate(e,t,i){return sn.makeTranslation(e,t,i),this.applyMatrix4(sn),this}scale(e,t,i){return sn.makeScale(e,t,i),this.applyMatrix4(sn),this}lookAt(e){return ja.lookAt(e),ja.updateMatrix(),this.applyMatrix4(ja.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($i).negate(),this.translate($i.x,$i.y,$i.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let s=0,a=e.length;s<a;s++){const o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Vn(i,3))}else{const i=Math.min(e.length,t.count);for(let s=0;s<i;s++){const a=e[s];t.setXYZ(s,a.x,a.y,a.z||0)}e.length>t.count&&Ve("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Es);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){nt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){const a=t[i];Qt.setFromBufferAttribute(a),this.morphTargetsRelative?(Nt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Nt),Nt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Nt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&nt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Tc);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){nt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const i=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let a=0,o=t.length;a<o;a++){const c=t[a];Yr.setFromBufferAttribute(c),this.morphTargetsRelative?(Nt.addVectors(Qt.min,Yr.min),Qt.expandByPoint(Nt),Nt.addVectors(Qt.max,Yr.max),Qt.expandByPoint(Nt)):(Qt.expandByPoint(Yr.min),Qt.expandByPoint(Yr.max))}Qt.getCenter(i);let s=0;for(let a=0,o=e.count;a<o;a++)Nt.fromBufferAttribute(e,a),s=Math.max(s,i.distanceToSquared(Nt));if(t)for(let a=0,o=t.length;a<o;a++){const c=t[a],l=this.morphTargetsRelative;for(let u=0,d=c.count;u<d;u++)Nt.fromBufferAttribute(c,u),l&&($i.fromBufferAttribute(e,u),Nt.add($i)),s=Math.max(s,i.distanceToSquared(Nt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&nt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){nt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,s=t.normal,a=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Mn(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),c=[],l=[];for(let V=0;V<i.count;V++)c[V]=new O,l[V]=new O;const u=new O,d=new O,f=new O,p=new at,m=new at,y=new at,v=new O,_=new O;function h(V,S,b){u.fromBufferAttribute(i,V),d.fromBufferAttribute(i,S),f.fromBufferAttribute(i,b),p.fromBufferAttribute(a,V),m.fromBufferAttribute(a,S),y.fromBufferAttribute(a,b),d.sub(u),f.sub(u),m.sub(p),y.sub(p);const L=1/(m.x*y.y-y.x*m.y);isFinite(L)&&(v.copy(d).multiplyScalar(y.y).addScaledVector(f,-m.y).multiplyScalar(L),_.copy(f).multiplyScalar(m.x).addScaledVector(d,-y.x).multiplyScalar(L),c[V].add(v),c[S].add(v),c[b].add(v),l[V].add(_),l[S].add(_),l[b].add(_))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let V=0,S=w.length;V<S;++V){const b=w[V],L=b.start,q=b.count;for(let H=L,J=L+q;H<J;H+=3)h(e.getX(H+0),e.getX(H+1),e.getX(H+2))}const T=new O,A=new O,I=new O,P=new O;function U(V){I.fromBufferAttribute(s,V),P.copy(I);const S=c[V];T.copy(S),T.sub(I.multiplyScalar(I.dot(S))).normalize(),A.crossVectors(P,S);const L=A.dot(l[V])<0?-1:1;o.setXYZW(V,T.x,T.y,T.z,L)}for(let V=0,S=w.length;V<S;++V){const b=w[V],L=b.start,q=b.count;for(let H=L,J=L+q;H<J;H+=3)U(e.getX(H+0)),U(e.getX(H+1)),U(e.getX(H+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new Mn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let p=0,m=i.count;p<m;p++)i.setXYZ(p,0,0,0);const s=new O,a=new O,o=new O,c=new O,l=new O,u=new O,d=new O,f=new O;if(e)for(let p=0,m=e.count;p<m;p+=3){const y=e.getX(p+0),v=e.getX(p+1),_=e.getX(p+2);s.fromBufferAttribute(t,y),a.fromBufferAttribute(t,v),o.fromBufferAttribute(t,_),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),c.fromBufferAttribute(i,y),l.fromBufferAttribute(i,v),u.fromBufferAttribute(i,_),c.add(d),l.add(d),u.add(d),i.setXYZ(y,c.x,c.y,c.z),i.setXYZ(v,l.x,l.y,l.z),i.setXYZ(_,u.x,u.y,u.z)}else for(let p=0,m=t.count;p<m;p+=3)s.fromBufferAttribute(t,p+0),a.fromBufferAttribute(t,p+1),o.fromBufferAttribute(t,p+2),d.subVectors(o,a),f.subVectors(s,a),d.cross(f),i.setXYZ(p+0,d.x,d.y,d.z),i.setXYZ(p+1,d.x,d.y,d.z),i.setXYZ(p+2,d.x,d.y,d.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Nt.fromBufferAttribute(e,t),Nt.normalize(),e.setXYZ(t,Nt.x,Nt.y,Nt.z)}toNonIndexed(){function e(c,l){const u=c.array,d=c.itemSize,f=c.normalized,p=new u.constructor(l.length*d);let m=0,y=0;for(let v=0,_=l.length;v<_;v++){c.isInterleavedBufferAttribute?m=l[v]*c.data.stride+c.offset:m=l[v]*d;for(let h=0;h<d;h++)p[y++]=u[m++]}return new Mn(p,d,f)}if(this.index===null)return Ve("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Hn,i=this.index.array,s=this.attributes;for(const c in s){const l=s[c],u=e(l,i);t.setAttribute(c,u)}const a=this.morphAttributes;for(const c in a){const l=[],u=a[c];for(let d=0,f=u.length;d<f;d++){const p=u[d],m=e(p,i);l.push(m)}t.morphAttributes[c]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let c=0,l=o.length;c<l;c++){const u=o[c];t.addGroup(u.start,u.count,u.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const u in l)l[u]!==void 0&&(e[u]=l[u]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const u=i[l];e.data.attributes[l]=u.toJSON(e.data)}const s={};let a=!1;for(const l in this.morphAttributes){const u=this.morphAttributes[l],d=[];for(let f=0,p=u.length;f<p;f++){const m=u[f];d.push(m.toJSON(e.data))}d.length>0&&(s[l]=d,a=!0)}a&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const c=this.boundingSphere;return c!==null&&(e.data.boundingSphere=c.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const s=e.attributes;for(const u in s){const d=s[u];this.setAttribute(u,d.clone(t))}const a=e.morphAttributes;for(const u in a){const d=[],f=a[u];for(let p=0,m=f.length;p<m;p++)d.push(f[p].clone(t));this.morphAttributes[u]=d}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let u=0,d=o.length;u<d;u++){const f=o[u];this.addGroup(f.start,f.count,f.materialIndex)}const c=e.boundingBox;c!==null&&(this.boundingBox=c.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ll=new Et,li=new Nh,zs=new Tc,ul=new O,Gs=new O,Hs=new O,Ws=new O,Ya=new O,qs=new O,dl=new O,Ks=new O;class pn extends zt{constructor(e=new Hn,t=new Ou){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,o=s.length;a<o;a++){const c=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[c]=a}}}}getVertexPosition(e,t){const i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);const c=this.morphTargetInfluences;if(a&&c){qs.set(0,0,0);for(let l=0,u=a.length;l<u;l++){const d=c[l],f=a[l];d!==0&&(Ya.fromBufferAttribute(f,e),o?qs.addScaledVector(Ya,d):qs.addScaledVector(Ya.sub(t),d))}t.add(qs)}return t}raycast(e,t){const i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),zs.copy(i.boundingSphere),zs.applyMatrix4(a),li.copy(e.ray).recast(e.near),!(zs.containsPoint(li.origin)===!1&&(li.intersectSphere(zs,ul)===null||li.origin.distanceToSquared(ul)>(e.far-e.near)**2))&&(ll.copy(a).invert(),li.copy(e.ray).applyMatrix4(ll),!(i.boundingBox!==null&&li.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,li)))}_computeIntersections(e,t,i){let s;const a=this.geometry,o=this.material,c=a.index,l=a.attributes.position,u=a.attributes.uv,d=a.attributes.uv1,f=a.attributes.normal,p=a.groups,m=a.drawRange;if(c!==null)if(Array.isArray(o))for(let y=0,v=p.length;y<v;y++){const _=p[y],h=o[_.materialIndex],w=Math.max(_.start,m.start),T=Math.min(c.count,Math.min(_.start+_.count,m.start+m.count));for(let A=w,I=T;A<I;A+=3){const P=c.getX(A),U=c.getX(A+1),V=c.getX(A+2);s=Xs(this,h,e,i,u,d,f,P,U,V),s&&(s.faceIndex=Math.floor(A/3),s.face.materialIndex=_.materialIndex,t.push(s))}}else{const y=Math.max(0,m.start),v=Math.min(c.count,m.start+m.count);for(let _=y,h=v;_<h;_+=3){const w=c.getX(_),T=c.getX(_+1),A=c.getX(_+2);s=Xs(this,o,e,i,u,d,f,w,T,A),s&&(s.faceIndex=Math.floor(_/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let y=0,v=p.length;y<v;y++){const _=p[y],h=o[_.materialIndex],w=Math.max(_.start,m.start),T=Math.min(l.count,Math.min(_.start+_.count,m.start+m.count));for(let A=w,I=T;A<I;A+=3){const P=A,U=A+1,V=A+2;s=Xs(this,h,e,i,u,d,f,P,U,V),s&&(s.faceIndex=Math.floor(A/3),s.face.materialIndex=_.materialIndex,t.push(s))}}else{const y=Math.max(0,m.start),v=Math.min(l.count,m.start+m.count);for(let _=y,h=v;_<h;_+=3){const w=_,T=_+1,A=_+2;s=Xs(this,o,e,i,u,d,f,w,T,A),s&&(s.faceIndex=Math.floor(_/3),t.push(s))}}}}function qh(n,e,t,i,s,a,o,c){let l;if(e.side===Yt?l=i.intersectTriangle(o,a,s,!0,c):l=i.intersectTriangle(s,a,o,e.side===ii,c),l===null)return null;Ks.copy(c),Ks.applyMatrix4(n.matrixWorld);const u=t.ray.origin.distanceTo(Ks);return u<t.near||u>t.far?null:{distance:u,point:Ks.clone(),object:n}}function Xs(n,e,t,i,s,a,o,c,l,u){n.getVertexPosition(c,Gs),n.getVertexPosition(l,Hs),n.getVertexPosition(u,Ws);const d=qh(n,e,t,i,Gs,Hs,Ws,dl);if(d){const f=new O;hn.getBarycoord(dl,Gs,Hs,Ws,f),s&&(d.uv=hn.getInterpolatedAttribute(s,c,l,u,f,new at)),a&&(d.uv1=hn.getInterpolatedAttribute(a,c,l,u,f,new at)),o&&(d.normal=hn.getInterpolatedAttribute(o,c,l,u,f,new O),d.normal.dot(i.direction)>0&&d.normal.multiplyScalar(-1));const p={a:c,b:l,c:u,normal:new O,materialIndex:0};hn.getNormal(Gs,Hs,Ws,p.normal),d.face=p,d.barycoord=f}return d}class Gr extends Hn{constructor(e=1,t=1,i=1,s=1,a=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:a,depthSegments:o};const c=this;s=Math.floor(s),a=Math.floor(a),o=Math.floor(o);const l=[],u=[],d=[],f=[];let p=0,m=0;y("z","y","x",-1,-1,i,t,e,o,a,0),y("z","y","x",1,-1,i,t,-e,o,a,1),y("x","z","y",1,1,e,i,t,s,o,2),y("x","z","y",1,-1,e,i,-t,s,o,3),y("x","y","z",1,-1,e,t,i,s,a,4),y("x","y","z",-1,-1,e,t,-i,s,a,5),this.setIndex(l),this.setAttribute("position",new Vn(u,3)),this.setAttribute("normal",new Vn(d,3)),this.setAttribute("uv",new Vn(f,2));function y(v,_,h,w,T,A,I,P,U,V,S){const b=A/U,L=I/V,q=A/2,H=I/2,J=P/2,Y=U+1,X=V+1;let G=0,te=0;const _e=new O;for(let he=0;he<X;he++){const ge=he*L-H;for(let je=0;je<Y;je++){const qe=je*b-q;_e[v]=qe*w,_e[_]=ge*T,_e[h]=J,u.push(_e.x,_e.y,_e.z),_e[v]=0,_e[_]=0,_e[h]=P>0?1:-1,d.push(_e.x,_e.y,_e.z),f.push(je/U),f.push(1-he/V),G+=1}}for(let he=0;he<V;he++)for(let ge=0;ge<U;ge++){const je=p+ge+Y*he,qe=p+ge+Y*(he+1),St=p+(ge+1)+Y*(he+1),vt=p+(ge+1)+Y*he;l.push(je,qe,vt),l.push(qe,St,vt),te+=6}c.addGroup(m,te,S),m+=te,p+=G}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Gr(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Or(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const s=n[t][i];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(Ve("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone():Array.isArray(s)?e[t][i]=s.slice():e[t][i]=s}}return e}function Ht(n){const e={};for(let t=0;t<n.length;t++){const i=Or(n[t]);for(const s in i)e[s]=i[s]}return e}function Kh(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function zu(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Qe.workingColorSpace}const Xh={clone:Or,merge:Ht};var jh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Yh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Tn extends Ts{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=jh,this.fragmentShader=Yh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Or(e.uniforms),this.uniformsGroups=Kh(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class Gu extends zt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Et,this.projectionMatrix=new Et,this.projectionMatrixInverse=new Et,this.coordinateSystem=vn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Yn=new O,hl=new at,fl=new at;class on extends Gu{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Zo*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Ia*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Zo*2*Math.atan(Math.tan(Ia*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z),Yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z)}getViewSize(e,t){return this.getViewBounds(e,hl,fl),t.subVectors(fl,hl)}setViewOffset(e,t,i,s,a,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Ia*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,a=-.5*s;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,u=o.fullHeight;a+=o.offsetX*s/l,t-=o.offsetY*i/u,s*=o.width/l,i*=o.height/u}const c=this.filmOffset;c!==0&&(a+=e*c/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Zi=-90,Ji=1;class $h extends zt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new on(Zi,Ji,e,t);s.layers=this.layers,this.add(s);const a=new on(Zi,Ji,e,t);a.layers=this.layers,this.add(a);const o=new on(Zi,Ji,e,t);o.layers=this.layers,this.add(o);const c=new on(Zi,Ji,e,t);c.layers=this.layers,this.add(c);const l=new on(Zi,Ji,e,t);l.layers=this.layers,this.add(l);const u=new on(Zi,Ji,e,t);u.layers=this.layers,this.add(u)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,s,a,o,c,l]=t;for(const u of t)this.remove(u);if(e===vn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),c.up.set(0,1,0),c.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===aa)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),c.up.set(0,-1,0),c.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const u of t)this.add(u),u.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,o,c,l,u,d]=this.children,f=e.getRenderTarget(),p=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),y=e.xr.enabled;e.xr.enabled=!1;const v=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,s),e.render(t,a),e.setRenderTarget(i,1,s),e.render(t,o),e.setRenderTarget(i,2,s),e.render(t,c),e.setRenderTarget(i,3,s),e.render(t,l),e.setRenderTarget(i,4,s),e.render(t,u),i.texture.generateMipmaps=v,e.setRenderTarget(i,5,s),e.render(t,d),e.setRenderTarget(f,p,m),e.xr.enabled=y,i.texture.needsPMREMUpdate=!0}}class Hu extends Wt{constructor(e=[],t=Oi,i,s,a,o,c,l,u,d){super(e,t,i,s,a,o,c,l,u,d),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Wu extends bn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new Hu(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Gr(5,5,5),a=new Tn({name:"CubemapFromEquirect",uniforms:Or(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Yt,blending:On});a.uniforms.tEquirect.value=t;const o=new pn(s,a),c=t.minFilter;return t.minFilter===Ci&&(t.minFilter=Vt),new $h(1,10,this).update(e,o),t.minFilter=c,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){const a=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(a)}}class js extends zt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Zh={type:"move"};class $a{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new js,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new js,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new js,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,a=null,o=null;const c=this._targetRay,l=this._grip,u=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(u&&e.hand){o=!0;for(const v of e.hand.values()){const _=t.getJointPose(v,i),h=this._getHandJoint(u,v);_!==null&&(h.matrix.fromArray(_.transform.matrix),h.matrix.decompose(h.position,h.rotation,h.scale),h.matrixWorldNeedsUpdate=!0,h.jointRadius=_.radius),h.visible=_!==null}const d=u.joints["index-finger-tip"],f=u.joints["thumb-tip"],p=d.position.distanceTo(f.position),m=.02,y=.005;u.inputState.pinching&&p>m+y?(u.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!u.inputState.pinching&&p<=m-y&&(u.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));c!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,this.dispatchEvent(Zh)))}return c!==null&&(c.visible=s!==null),l!==null&&(l.visible=a!==null),u!==null&&(u.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new js;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}class Jh extends zt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new En,this.environmentIntensity=1,this.environmentRotation=new En,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}class Qh extends Wt{constructor(e=null,t=1,i=1,s,a,o,c,l,u=Bt,d=Bt,f,p){super(null,o,c,l,u,d,s,a,f,p),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Za=new O,ef=new O,tf=new He;class fi{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const s=Za.subVectors(i,t).cross(ef.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(Za),s=this.normal.dot(i);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return a<0||a>1?null:t.copy(e.start).addScaledVector(i,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||tf.getNormalMatrix(e),s=this.coplanarPoint(Za).applyMatrix4(e),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ui=new Tc,nf=new at(.5,.5),Ys=new O;class Ac{constructor(e=new fi,t=new fi,i=new fi,s=new fi,a=new fi,o=new fi){this.planes=[e,t,i,s,a,o]}set(e,t,i,s,a,o){const c=this.planes;return c[0].copy(e),c[1].copy(t),c[2].copy(i),c[3].copy(s),c[4].copy(a),c[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=vn,i=!1){const s=this.planes,a=e.elements,o=a[0],c=a[1],l=a[2],u=a[3],d=a[4],f=a[5],p=a[6],m=a[7],y=a[8],v=a[9],_=a[10],h=a[11],w=a[12],T=a[13],A=a[14],I=a[15];if(s[0].setComponents(u-o,m-d,h-y,I-w).normalize(),s[1].setComponents(u+o,m+d,h+y,I+w).normalize(),s[2].setComponents(u+c,m+f,h+v,I+T).normalize(),s[3].setComponents(u-c,m-f,h-v,I-T).normalize(),i)s[4].setComponents(l,p,_,A).normalize(),s[5].setComponents(u-l,m-p,h-_,I-A).normalize();else if(s[4].setComponents(u-l,m-p,h-_,I-A).normalize(),t===vn)s[5].setComponents(u+l,m+p,h+_,I+A).normalize();else if(t===aa)s[5].setComponents(l,p,_,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ui.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ui.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ui)}intersectsSprite(e){ui.center.set(0,0,0);const t=nf.distanceTo(e.center);return ui.radius=.7071067811865476+t,ui.applyMatrix4(e.matrixWorld),this.intersectsSphere(ui)}intersectsSphere(e){const t=this.planes,i=e.center,s=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const s=t[i];if(Ys.x=s.normal.x>0?e.max.x:e.min.x,Ys.y=s.normal.y>0?e.max.y:e.min.y,Ys.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Ys)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ds extends Wt{constructor(e,t,i=wn,s,a,o,c=Bt,l=Bt,u,d=Gn,f=1){if(d!==Gn&&d!==Pi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const p={width:e,height:t,depth:f};super(p,s,a,o,c,l,d,i,u),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ec(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class rf extends ds{constructor(e,t=wn,i=Oi,s,a,o=Bt,c=Bt,l,u=Gn){const d={width:e,height:e,depth:1},f=[d,d,d,d,d,d];super(e,e,t,i,s,a,o,c,l,u),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class qu extends Wt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class As extends Hn{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};const a=e/2,o=t/2,c=Math.floor(i),l=Math.floor(s),u=c+1,d=l+1,f=e/c,p=t/l,m=[],y=[],v=[],_=[];for(let h=0;h<d;h++){const w=h*p-o;for(let T=0;T<u;T++){const A=T*f-a;y.push(A,-w,0),v.push(0,0,1),_.push(T/c),_.push(1-h/l)}}for(let h=0;h<l;h++)for(let w=0;w<c;w++){const T=w+u*h,A=w+u*(h+1),I=w+1+u*(h+1),P=w+1+u*h;m.push(T,A,P),m.push(A,I,P)}this.setIndex(m),this.setAttribute("position",new Vn(y,3)),this.setAttribute("normal",new Vn(v,3)),this.setAttribute("uv",new Vn(_,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new As(e.width,e.height,e.widthSegments,e.heightSegments)}}class sf extends Tn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class pl extends Ts{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new it(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new it(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Du,this.normalScale=new at(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new En,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class af extends Ts{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=gh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class of extends Ts{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Ku extends zt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new it(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}const Ja=new Et,ml=new O,_l=new O;class cf{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new at(512,512),this.mapType=en,this.map=null,this.mapPass=null,this.matrix=new Et,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ac,this._frameExtents=new at(1,1),this._viewportCount=1,this._viewports=[new wt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;ml.setFromMatrixPosition(e.matrixWorld),t.position.copy(ml),_l.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(_l),t.updateMatrixWorld(),Ja.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ja,t.coordinateSystem,t.reversedDepth),t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Ja)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class Ic extends Gu{constructor(e=-1,t=1,i=1,s=-1,a=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=a,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,a,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let a=i-e,o=i+e,c=s+t,l=s-t;if(this.view!==null&&this.view.enabled){const u=(this.right-this.left)/this.view.fullWidth/this.zoom,d=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=u*this.view.offsetX,o=a+u*this.view.width,c-=d*this.view.offsetY,l=c-d*this.view.height}this.projectionMatrix.makeOrthographic(a,o,c,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class lf extends cf{constructor(){super(new Ic(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class uf extends Ku{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(zt.DEFAULT_UP),this.updateMatrix(),this.target=new zt,this.shadow=new lf}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class df extends Ku{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class hf extends on{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}function gl(n,e,t,i){const s=ff(i);switch(t){case Cu:return n*e;case Uu:return n*e/s.components*s.byteLength;case vc:return n*e/s.components*s.byteLength;case Fr:return n*e*2/s.components*s.byteLength;case Sc:return n*e*2/s.components*s.byteLength;case Pu:return n*e*3/s.components*s.byteLength;case fn:return n*e*4/s.components*s.byteLength;case bc:return n*e*4/s.components*s.byteLength;case Qs:case ea:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ta:case na:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case vo:case bo:return Math.max(n,16)*Math.max(e,8)/4;case xo:case So:return Math.max(n,8)*Math.max(e,8)/2;case Mo:case wo:case To:case Ao:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Eo:case Io:case Ro:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Co:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Po:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Uo:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Do:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Lo:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case No:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Fo:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Bo:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Oo:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case ko:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Vo:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case zo:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Go:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Ho:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Wo:case qo:case Ko:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Xo:case jo:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Yo:case $o:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function ff(n){switch(n){case en:case Tu:return{byteLength:1,components:1};case cs:case Au:case zn:return{byteLength:2,components:1};case yc:case xc:return{byteLength:2,components:4};case wn:case gc:case xn:return{byteLength:4,components:1};case Iu:case Ru:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:_c}}));typeof window<"u"&&(window.__THREE__?Ve("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=_c);/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Xu(){let n=null,e=!1,t=null,i=null;function s(a,o){t(a,o),i=n.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){n=a}}}function pf(n){const e=new WeakMap;function t(c,l){const u=c.array,d=c.usage,f=u.byteLength,p=n.createBuffer();n.bindBuffer(l,p),n.bufferData(l,u,d),c.onUploadCallback();let m;if(u instanceof Float32Array)m=n.FLOAT;else if(typeof Float16Array<"u"&&u instanceof Float16Array)m=n.HALF_FLOAT;else if(u instanceof Uint16Array)c.isFloat16BufferAttribute?m=n.HALF_FLOAT:m=n.UNSIGNED_SHORT;else if(u instanceof Int16Array)m=n.SHORT;else if(u instanceof Uint32Array)m=n.UNSIGNED_INT;else if(u instanceof Int32Array)m=n.INT;else if(u instanceof Int8Array)m=n.BYTE;else if(u instanceof Uint8Array)m=n.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)m=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:p,type:m,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:f}}function i(c,l,u){const d=l.array,f=l.updateRanges;if(n.bindBuffer(u,c),f.length===0)n.bufferSubData(u,0,d);else{f.sort((m,y)=>m.start-y.start);let p=0;for(let m=1;m<f.length;m++){const y=f[p],v=f[m];v.start<=y.start+y.count+1?y.count=Math.max(y.count,v.start+v.count-y.start):(++p,f[p]=v)}f.length=p+1;for(let m=0,y=f.length;m<y;m++){const v=f[m];n.bufferSubData(u,v.start*d.BYTES_PER_ELEMENT,d,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(c){return c.isInterleavedBufferAttribute&&(c=c.data),e.get(c)}function a(c){c.isInterleavedBufferAttribute&&(c=c.data);const l=e.get(c);l&&(n.deleteBuffer(l.buffer),e.delete(c))}function o(c,l){if(c.isInterleavedBufferAttribute&&(c=c.data),c.isGLBufferAttribute){const d=e.get(c);(!d||d.version<c.version)&&e.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}const u=e.get(c);if(u===void 0)e.set(c,t(c,l));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(u.buffer,c,l),u.version=c.version}}return{get:s,remove:a,update:o}}var mf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,_f=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,gf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,yf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,xf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,vf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Sf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,bf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Mf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,wf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Ef=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Tf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Af=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,If=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Rf=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Cf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Pf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Uf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Df=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Lf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Nf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ff=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Bf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Of=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,kf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Vf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,zf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Gf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Hf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Wf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,qf="gl_FragColor = linearToOutputTexel( gl_FragColor );",Kf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Xf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,jf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Yf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,$f=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Zf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Jf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Qf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ep=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,tp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,np=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ip=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,rp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,sp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ap=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,op=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,cp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,up=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,dp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,hp=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,fp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return v;
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( vec3( 1.0 ) - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,pp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,mp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,_p=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,gp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,yp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,xp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,vp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Sp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,bp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Mp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,wp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ep=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Tp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Ap=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Ip=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Rp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Cp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Pp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Up=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Dp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Lp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Np=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Fp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Bp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Op=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,kp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Vp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,zp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Gp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Hp=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Wp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,qp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Kp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Xp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,jp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Yp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,$p=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * 6.28318530718;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * 6.28318530718;
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 0, 5, phi ).x + bitangent * vogelDiskSample( 0, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 1, 5, phi ).x + bitangent * vogelDiskSample( 1, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 2, 5, phi ).x + bitangent * vogelDiskSample( 2, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 3, 5, phi ).x + bitangent * vogelDiskSample( 3, 5, phi ).y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * vogelDiskSample( 4, 5, phi ).x + bitangent * vogelDiskSample( 4, 5, phi ).y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadow = step( depth, dp );
			#else
				shadow = step( dp, depth );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Zp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Jp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Qp=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,em=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,tm=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,nm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,im=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,rm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,sm=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,am=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,om=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,cm=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,lm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,um=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,dm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,hm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,fm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const pm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,mm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_m=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,gm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ym=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,xm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,vm=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Sm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,bm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Mm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,wm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Em=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Am=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Im=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Rm=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Cm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pm=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Um=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Dm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Nm=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Fm=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bm=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Om=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,km=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vm=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,zm=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Gm=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Hm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Wm=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,qm=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Km=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Xm=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,We={alphahash_fragment:mf,alphahash_pars_fragment:_f,alphamap_fragment:gf,alphamap_pars_fragment:yf,alphatest_fragment:xf,alphatest_pars_fragment:vf,aomap_fragment:Sf,aomap_pars_fragment:bf,batching_pars_vertex:Mf,batching_vertex:wf,begin_vertex:Ef,beginnormal_vertex:Tf,bsdfs:Af,iridescence_fragment:If,bumpmap_pars_fragment:Rf,clipping_planes_fragment:Cf,clipping_planes_pars_fragment:Pf,clipping_planes_pars_vertex:Uf,clipping_planes_vertex:Df,color_fragment:Lf,color_pars_fragment:Nf,color_pars_vertex:Ff,color_vertex:Bf,common:Of,cube_uv_reflection_fragment:kf,defaultnormal_vertex:Vf,displacementmap_pars_vertex:zf,displacementmap_vertex:Gf,emissivemap_fragment:Hf,emissivemap_pars_fragment:Wf,colorspace_fragment:qf,colorspace_pars_fragment:Kf,envmap_fragment:Xf,envmap_common_pars_fragment:jf,envmap_pars_fragment:Yf,envmap_pars_vertex:$f,envmap_physical_pars_fragment:op,envmap_vertex:Zf,fog_vertex:Jf,fog_pars_vertex:Qf,fog_fragment:ep,fog_pars_fragment:tp,gradientmap_pars_fragment:np,lightmap_pars_fragment:ip,lights_lambert_fragment:rp,lights_lambert_pars_fragment:sp,lights_pars_begin:ap,lights_toon_fragment:cp,lights_toon_pars_fragment:lp,lights_phong_fragment:up,lights_phong_pars_fragment:dp,lights_physical_fragment:hp,lights_physical_pars_fragment:fp,lights_fragment_begin:pp,lights_fragment_maps:mp,lights_fragment_end:_p,logdepthbuf_fragment:gp,logdepthbuf_pars_fragment:yp,logdepthbuf_pars_vertex:xp,logdepthbuf_vertex:vp,map_fragment:Sp,map_pars_fragment:bp,map_particle_fragment:Mp,map_particle_pars_fragment:wp,metalnessmap_fragment:Ep,metalnessmap_pars_fragment:Tp,morphinstance_vertex:Ap,morphcolor_vertex:Ip,morphnormal_vertex:Rp,morphtarget_pars_vertex:Cp,morphtarget_vertex:Pp,normal_fragment_begin:Up,normal_fragment_maps:Dp,normal_pars_fragment:Lp,normal_pars_vertex:Np,normal_vertex:Fp,normalmap_pars_fragment:Bp,clearcoat_normal_fragment_begin:Op,clearcoat_normal_fragment_maps:kp,clearcoat_pars_fragment:Vp,iridescence_pars_fragment:zp,opaque_fragment:Gp,packing:Hp,premultiplied_alpha_fragment:Wp,project_vertex:qp,dithering_fragment:Kp,dithering_pars_fragment:Xp,roughnessmap_fragment:jp,roughnessmap_pars_fragment:Yp,shadowmap_pars_fragment:$p,shadowmap_pars_vertex:Zp,shadowmap_vertex:Jp,shadowmask_pars_fragment:Qp,skinbase_vertex:em,skinning_pars_vertex:tm,skinning_vertex:nm,skinnormal_vertex:im,specularmap_fragment:rm,specularmap_pars_fragment:sm,tonemapping_fragment:am,tonemapping_pars_fragment:om,transmission_fragment:cm,transmission_pars_fragment:lm,uv_pars_fragment:um,uv_pars_vertex:dm,uv_vertex:hm,worldpos_vertex:fm,background_vert:pm,background_frag:mm,backgroundCube_vert:_m,backgroundCube_frag:gm,cube_vert:ym,cube_frag:xm,depth_vert:vm,depth_frag:Sm,distance_vert:bm,distance_frag:Mm,equirect_vert:wm,equirect_frag:Em,linedashed_vert:Tm,linedashed_frag:Am,meshbasic_vert:Im,meshbasic_frag:Rm,meshlambert_vert:Cm,meshlambert_frag:Pm,meshmatcap_vert:Um,meshmatcap_frag:Dm,meshnormal_vert:Lm,meshnormal_frag:Nm,meshphong_vert:Fm,meshphong_frag:Bm,meshphysical_vert:Om,meshphysical_frag:km,meshtoon_vert:Vm,meshtoon_frag:zm,points_vert:Gm,points_frag:Hm,shadow_vert:Wm,shadow_frag:qm,sprite_vert:Km,sprite_frag:Xm},fe={common:{diffuse:{value:new it(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new He}},envmap:{envMap:{value:null},envMapRotation:{value:new He},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new He}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new He}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new He},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new He},normalScale:{value:new at(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new He},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new He}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new He}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new He}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new it(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new it(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0},uvTransform:{value:new He}},sprite:{diffuse:{value:new it(16777215)},opacity:{value:1},center:{value:new at(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new He},alphaMap:{value:null},alphaMapTransform:{value:new He},alphaTest:{value:0}}},yn={basic:{uniforms:Ht([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.fog]),vertexShader:We.meshbasic_vert,fragmentShader:We.meshbasic_frag},lambert:{uniforms:Ht([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new it(0)}}]),vertexShader:We.meshlambert_vert,fragmentShader:We.meshlambert_frag},phong:{uniforms:Ht([fe.common,fe.specularmap,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,fe.lights,{emissive:{value:new it(0)},specular:{value:new it(1118481)},shininess:{value:30}}]),vertexShader:We.meshphong_vert,fragmentShader:We.meshphong_frag},standard:{uniforms:Ht([fe.common,fe.envmap,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.roughnessmap,fe.metalnessmap,fe.fog,fe.lights,{emissive:{value:new it(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag},toon:{uniforms:Ht([fe.common,fe.aomap,fe.lightmap,fe.emissivemap,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.gradientmap,fe.fog,fe.lights,{emissive:{value:new it(0)}}]),vertexShader:We.meshtoon_vert,fragmentShader:We.meshtoon_frag},matcap:{uniforms:Ht([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,fe.fog,{matcap:{value:null}}]),vertexShader:We.meshmatcap_vert,fragmentShader:We.meshmatcap_frag},points:{uniforms:Ht([fe.points,fe.fog]),vertexShader:We.points_vert,fragmentShader:We.points_frag},dashed:{uniforms:Ht([fe.common,fe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:We.linedashed_vert,fragmentShader:We.linedashed_frag},depth:{uniforms:Ht([fe.common,fe.displacementmap]),vertexShader:We.depth_vert,fragmentShader:We.depth_frag},normal:{uniforms:Ht([fe.common,fe.bumpmap,fe.normalmap,fe.displacementmap,{opacity:{value:1}}]),vertexShader:We.meshnormal_vert,fragmentShader:We.meshnormal_frag},sprite:{uniforms:Ht([fe.sprite,fe.fog]),vertexShader:We.sprite_vert,fragmentShader:We.sprite_frag},background:{uniforms:{uvTransform:{value:new He},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:We.background_vert,fragmentShader:We.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new He}},vertexShader:We.backgroundCube_vert,fragmentShader:We.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:We.cube_vert,fragmentShader:We.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:We.equirect_vert,fragmentShader:We.equirect_frag},distance:{uniforms:Ht([fe.common,fe.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:We.distance_vert,fragmentShader:We.distance_frag},shadow:{uniforms:Ht([fe.lights,fe.fog,{color:{value:new it(0)},opacity:{value:1}}]),vertexShader:We.shadow_vert,fragmentShader:We.shadow_frag}};yn.physical={uniforms:Ht([yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new He},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new He},clearcoatNormalScale:{value:new at(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new He},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new He},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new He},sheen:{value:0},sheenColor:{value:new it(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new He},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new He},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new He},transmissionSamplerSize:{value:new at},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new He},attenuationDistance:{value:0},attenuationColor:{value:new it(0)},specularColor:{value:new it(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new He},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new He},anisotropyVector:{value:new at},anisotropyMap:{value:null},anisotropyMapTransform:{value:new He}}]),vertexShader:We.meshphysical_vert,fragmentShader:We.meshphysical_frag};const $s={r:0,b:0,g:0},di=new En,jm=new Et;function Ym(n,e,t,i,s,a,o){const c=new it(0);let l=a===!0?0:1,u,d,f=null,p=0,m=null;function y(T){let A=T.isScene===!0?T.background:null;return A&&A.isTexture&&(A=(T.backgroundBlurriness>0?t:e).get(A)),A}function v(T){let A=!1;const I=y(T);I===null?h(c,l):I&&I.isColor&&(h(I,1),A=!0);const P=n.xr.getEnvironmentBlendMode();P==="additive"?i.buffers.color.setClear(0,0,0,1,o):P==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(n.autoClear||A)&&(i.buffers.depth.setTest(!0),i.buffers.depth.setMask(!0),i.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function _(T,A){const I=y(A);I&&(I.isCubeTexture||I.mapping===ya)?(d===void 0&&(d=new pn(new Gr(1,1,1),new Tn({name:"BackgroundCubeMaterial",uniforms:Or(yn.backgroundCube.uniforms),vertexShader:yn.backgroundCube.vertexShader,fragmentShader:yn.backgroundCube.fragmentShader,side:Yt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(P,U,V){this.matrixWorld.copyPosition(V.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(d)),di.copy(A.backgroundRotation),di.x*=-1,di.y*=-1,di.z*=-1,I.isCubeTexture&&I.isRenderTargetTexture===!1&&(di.y*=-1,di.z*=-1),d.material.uniforms.envMap.value=I,d.material.uniforms.flipEnvMap.value=I.isCubeTexture&&I.isRenderTargetTexture===!1?-1:1,d.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(jm.makeRotationFromEuler(di)),d.material.toneMapped=Qe.getTransfer(I.colorSpace)!==ft,(f!==I||p!==I.version||m!==n.toneMapping)&&(d.material.needsUpdate=!0,f=I,p=I.version,m=n.toneMapping),d.layers.enableAll(),T.unshift(d,d.geometry,d.material,0,0,null)):I&&I.isTexture&&(u===void 0&&(u=new pn(new As(2,2),new Tn({name:"BackgroundMaterial",uniforms:Or(yn.background.uniforms),vertexShader:yn.background.vertexShader,fragmentShader:yn.background.fragmentShader,side:ii,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(u)),u.material.uniforms.t2D.value=I,u.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,u.material.toneMapped=Qe.getTransfer(I.colorSpace)!==ft,I.matrixAutoUpdate===!0&&I.updateMatrix(),u.material.uniforms.uvTransform.value.copy(I.matrix),(f!==I||p!==I.version||m!==n.toneMapping)&&(u.material.needsUpdate=!0,f=I,p=I.version,m=n.toneMapping),u.layers.enableAll(),T.unshift(u,u.geometry,u.material,0,0,null))}function h(T,A){T.getRGB($s,zu(n)),i.buffers.color.setClear($s.r,$s.g,$s.b,A,o)}function w(){d!==void 0&&(d.geometry.dispose(),d.material.dispose(),d=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return c},setClearColor:function(T,A=1){c.set(T),l=A,h(c,l)},getClearAlpha:function(){return l},setClearAlpha:function(T){l=T,h(c,l)},render:v,addToRenderList:_,dispose:w}}function $m(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=p(null);let a=s,o=!1;function c(b,L,q,H,J){let Y=!1;const X=f(H,q,L);a!==X&&(a=X,u(a.object)),Y=m(b,H,q,J),Y&&y(b,H,q,J),J!==null&&e.update(J,n.ELEMENT_ARRAY_BUFFER),(Y||o)&&(o=!1,A(b,L,q,H),J!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(J).buffer))}function l(){return n.createVertexArray()}function u(b){return n.bindVertexArray(b)}function d(b){return n.deleteVertexArray(b)}function f(b,L,q){const H=q.wireframe===!0;let J=i[b.id];J===void 0&&(J={},i[b.id]=J);let Y=J[L.id];Y===void 0&&(Y={},J[L.id]=Y);let X=Y[H];return X===void 0&&(X=p(l()),Y[H]=X),X}function p(b){const L=[],q=[],H=[];for(let J=0;J<t;J++)L[J]=0,q[J]=0,H[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:q,attributeDivisors:H,object:b,attributes:{},index:null}}function m(b,L,q,H){const J=a.attributes,Y=L.attributes;let X=0;const G=q.getAttributes();for(const te in G)if(G[te].location>=0){const he=J[te];let ge=Y[te];if(ge===void 0&&(te==="instanceMatrix"&&b.instanceMatrix&&(ge=b.instanceMatrix),te==="instanceColor"&&b.instanceColor&&(ge=b.instanceColor)),he===void 0||he.attribute!==ge||ge&&he.data!==ge.data)return!0;X++}return a.attributesNum!==X||a.index!==H}function y(b,L,q,H){const J={},Y=L.attributes;let X=0;const G=q.getAttributes();for(const te in G)if(G[te].location>=0){let he=Y[te];he===void 0&&(te==="instanceMatrix"&&b.instanceMatrix&&(he=b.instanceMatrix),te==="instanceColor"&&b.instanceColor&&(he=b.instanceColor));const ge={};ge.attribute=he,he&&he.data&&(ge.data=he.data),J[te]=ge,X++}a.attributes=J,a.attributesNum=X,a.index=H}function v(){const b=a.newAttributes;for(let L=0,q=b.length;L<q;L++)b[L]=0}function _(b){h(b,0)}function h(b,L){const q=a.newAttributes,H=a.enabledAttributes,J=a.attributeDivisors;q[b]=1,H[b]===0&&(n.enableVertexAttribArray(b),H[b]=1),J[b]!==L&&(n.vertexAttribDivisor(b,L),J[b]=L)}function w(){const b=a.newAttributes,L=a.enabledAttributes;for(let q=0,H=L.length;q<H;q++)L[q]!==b[q]&&(n.disableVertexAttribArray(q),L[q]=0)}function T(b,L,q,H,J,Y,X){X===!0?n.vertexAttribIPointer(b,L,q,J,Y):n.vertexAttribPointer(b,L,q,H,J,Y)}function A(b,L,q,H){v();const J=H.attributes,Y=q.getAttributes(),X=L.defaultAttributeValues;for(const G in Y){const te=Y[G];if(te.location>=0){let _e=J[G];if(_e===void 0&&(G==="instanceMatrix"&&b.instanceMatrix&&(_e=b.instanceMatrix),G==="instanceColor"&&b.instanceColor&&(_e=b.instanceColor)),_e!==void 0){const he=_e.normalized,ge=_e.itemSize,je=e.get(_e);if(je===void 0)continue;const qe=je.buffer,St=je.type,vt=je.bytesPerElement,$=St===n.INT||St===n.UNSIGNED_INT||_e.gpuType===gc;if(_e.isInterleavedBufferAttribute){const ne=_e.data,Se=ne.stride,ze=_e.offset;if(ne.isInstancedInterleavedBuffer){for(let Ee=0;Ee<te.locationSize;Ee++)h(te.location+Ee,ne.meshPerAttribute);b.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let Ee=0;Ee<te.locationSize;Ee++)_(te.location+Ee);n.bindBuffer(n.ARRAY_BUFFER,qe);for(let Ee=0;Ee<te.locationSize;Ee++)T(te.location+Ee,ge/te.locationSize,St,he,Se*vt,(ze+ge/te.locationSize*Ee)*vt,$)}else{if(_e.isInstancedBufferAttribute){for(let ne=0;ne<te.locationSize;ne++)h(te.location+ne,_e.meshPerAttribute);b.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=_e.meshPerAttribute*_e.count)}else for(let ne=0;ne<te.locationSize;ne++)_(te.location+ne);n.bindBuffer(n.ARRAY_BUFFER,qe);for(let ne=0;ne<te.locationSize;ne++)T(te.location+ne,ge/te.locationSize,St,he,ge*vt,ge/te.locationSize*ne*vt,$)}}else if(X!==void 0){const he=X[G];if(he!==void 0)switch(he.length){case 2:n.vertexAttrib2fv(te.location,he);break;case 3:n.vertexAttrib3fv(te.location,he);break;case 4:n.vertexAttrib4fv(te.location,he);break;default:n.vertexAttrib1fv(te.location,he)}}}}w()}function I(){V();for(const b in i){const L=i[b];for(const q in L){const H=L[q];for(const J in H)d(H[J].object),delete H[J];delete L[q]}delete i[b]}}function P(b){if(i[b.id]===void 0)return;const L=i[b.id];for(const q in L){const H=L[q];for(const J in H)d(H[J].object),delete H[J];delete L[q]}delete i[b.id]}function U(b){for(const L in i){const q=i[L];if(q[b.id]===void 0)continue;const H=q[b.id];for(const J in H)d(H[J].object),delete H[J];delete q[b.id]}}function V(){S(),o=!0,a!==s&&(a=s,u(a.object))}function S(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:c,reset:V,resetDefaultState:S,dispose:I,releaseStatesOfGeometry:P,releaseStatesOfProgram:U,initAttributes:v,enableAttribute:_,disableUnusedAttributes:w}}function Zm(n,e,t){let i;function s(u){i=u}function a(u,d){n.drawArrays(i,u,d),t.update(d,i,1)}function o(u,d,f){f!==0&&(n.drawArraysInstanced(i,u,d,f),t.update(d,i,f))}function c(u,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,u,0,d,0,f);let m=0;for(let y=0;y<f;y++)m+=d[y];t.update(m,i,1)}function l(u,d,f,p){if(f===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let y=0;y<u.length;y++)o(u[y],d[y],p[y]);else{m.multiDrawArraysInstancedWEBGL(i,u,0,d,0,p,0,f);let y=0;for(let v=0;v<f;v++)y+=d[v]*p[v];t.update(y,i,1)}}this.setMode=s,this.render=a,this.renderInstances=o,this.renderMultiDraw=c,this.renderMultiDrawInstances=l}function Jm(n,e,t,i){let s;function a(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const U=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(U.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(U){return!(U!==fn&&i.convert(U)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function c(U){const V=U===zn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(U!==en&&i.convert(U)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&U!==xn&&!V)}function l(U){if(U==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";U="mediump"}return U==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let u=t.precision!==void 0?t.precision:"highp";const d=l(u);d!==u&&(Ve("WebGLRenderer:",u,"not supported, using",d,"instead."),u=d);const f=t.logarithmicDepthBuffer===!0,p=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),m=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=n.getParameter(n.MAX_TEXTURE_SIZE),_=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),h=n.getParameter(n.MAX_VERTEX_ATTRIBS),w=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),T=n.getParameter(n.MAX_VARYING_VECTORS),A=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),I=n.getParameter(n.MAX_SAMPLES),P=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:c,precision:u,logarithmicDepthBuffer:f,reversedDepthBuffer:p,maxTextures:m,maxVertexTextures:y,maxTextureSize:v,maxCubemapSize:_,maxAttributes:h,maxVertexUniforms:w,maxVaryings:T,maxFragmentUniforms:A,maxSamples:I,samples:P}}function Qm(n){const e=this;let t=null,i=0,s=!1,a=!1;const o=new fi,c=new He,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,p){const m=f.length!==0||p||i!==0||s;return s=p,i=f.length,m},this.beginShadows=function(){a=!0,d(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(f,p){t=d(f,p,0)},this.setState=function(f,p,m){const y=f.clippingPlanes,v=f.clipIntersection,_=f.clipShadows,h=n.get(f);if(!s||y===null||y.length===0||a&&!_)a?d(null):u();else{const w=a?0:i,T=w*4;let A=h.clippingState||null;l.value=A,A=d(y,p,T,m);for(let I=0;I!==T;++I)A[I]=t[I];h.clippingState=A,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=w}};function u(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function d(f,p,m,y){const v=f!==null?f.length:0;let _=null;if(v!==0){if(_=l.value,y!==!0||_===null){const h=m+v*4,w=p.matrixWorldInverse;c.getNormalMatrix(w),(_===null||_.length<h)&&(_=new Float32Array(h));for(let T=0,A=m;T!==v;++T,A+=4)o.copy(f[T]).applyMatrix4(w,c),o.normal.toArray(_,A),_[A+3]=o.constant}l.value=_,l.needsUpdate=!0}return e.numPlanes=v,e.numIntersection=0,_}}function e_(n){let e=new WeakMap;function t(o,c){return c===mo?o.mapping=Oi:c===_o&&(o.mapping=Nr),o}function i(o){if(o&&o.isTexture){const c=o.mapping;if(c===mo||c===_o)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const u=new Wu(l.height);return u.fromEquirectangularTexture(n,o),e.set(o,u),o.addEventListener("dispose",s),t(u.texture,o.mapping)}else return null}}return o}function s(o){const c=o.target;c.removeEventListener("dispose",s);const l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function a(){e=new WeakMap}return{get:i,dispose:a}}const ti=4,yl=[.125,.215,.35,.446,.526,.582],Ii=20,t_=256,$r=new Ic,xl=new it;let Qa=null,eo=0,to=0,no=!1;const n_=new O;class vl{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,s=100,a={}){const{size:o=256,position:c=n_}=a;Qa=this._renderer.getRenderTarget(),eo=this._renderer.getActiveCubeFace(),to=this._renderer.getActiveMipmapLevel(),no=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,c),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ml(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=bl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Qa,eo,to),this._renderer.xr.enabled=no,e.scissorTest=!1,Qi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Oi||e.mapping===Nr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Qa=this._renderer.getRenderTarget(),eo=this._renderer.getActiveCubeFace(),to=this._renderer.getActiveMipmapLevel(),no=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Vt,minFilter:Vt,generateMipmaps:!1,type:zn,format:fn,colorSpace:Br,depthBuffer:!1},s=Sl(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Sl(e,t,i);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=i_(a)),this._blurMaterial=s_(a,e,t),this._ggxMaterial=r_(a,e,t)}return s}_compileMaterial(e){const t=new pn(new Hn,e);this._renderer.compile(t,$r)}_sceneToCubeUV(e,t,i,s,a){const l=new on(90,1,t,i),u=[1,-1,1,1,1,1],d=[1,1,1,-1,-1,-1],f=this._renderer,p=f.autoClear,m=f.toneMapping;f.getClearColor(xl),f.toneMapping=Sn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new pn(new Gr,new Ou({name:"PMREM.Background",side:Yt,depthWrite:!1,depthTest:!1})));const v=this._backgroundBox,_=v.material;let h=!1;const w=e.background;w?w.isColor&&(_.color.copy(w),e.background=null,h=!0):(_.color.copy(xl),h=!0);for(let T=0;T<6;T++){const A=T%3;A===0?(l.up.set(0,u[T],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+d[T],a.y,a.z)):A===1?(l.up.set(0,0,u[T]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+d[T],a.z)):(l.up.set(0,u[T],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+d[T]));const I=this._cubeSize;Qi(s,A*I,T>2?I:0,I,I),f.setRenderTarget(s),h&&f.render(v,l),f.render(e,l)}f.toneMapping=m,f.autoClear=p,e.background=w}_textureToCubeUV(e,t){const i=this._renderer,s=e.mapping===Oi||e.mapping===Nr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ml()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=bl());const a=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=a;const c=a.uniforms;c.envMap.value=e;const l=this._cubeSize;Qi(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,$r)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(e,a-1,a);t.autoClear=i}_applyGGXFilter(e,t,i){const s=this._renderer,a=this._pingPongRenderTarget,o=this._ggxMaterial,c=this._lodMeshes[i];c.material=o;const l=o.uniforms,u=i/(this._lodMeshes.length-1),d=t/(this._lodMeshes.length-1),f=Math.sqrt(u*u-d*d),p=0+u*1.25,m=f*p,{_lodMax:y}=this,v=this._sizeLods[i],_=3*v*(i>y-ti?i-y+ti:0),h=4*(this._cubeSize-v);l.envMap.value=e.texture,l.roughness.value=m,l.mipInt.value=y-t,Qi(a,_,h,3*v,2*v),s.setRenderTarget(a),s.render(c,$r),l.envMap.value=a.texture,l.roughness.value=0,l.mipInt.value=y-i,Qi(e,_,h,3*v,2*v),s.setRenderTarget(e),s.render(c,$r)}_blur(e,t,i,s,a){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,s,"latitudinal",a),this._halfBlur(o,e,i,i,s,"longitudinal",a)}_halfBlur(e,t,i,s,a,o,c){const l=this._renderer,u=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&nt("blur direction must be either latitudinal or longitudinal!");const d=3,f=this._lodMeshes[s];f.material=u;const p=u.uniforms,m=this._sizeLods[i]-1,y=isFinite(a)?Math.PI/(2*m):2*Math.PI/(2*Ii-1),v=a/y,_=isFinite(a)?1+Math.floor(d*v):Ii;_>Ii&&Ve(`sigmaRadians, ${a}, is too large and will clip, as it requested ${_} samples when the maximum is set to ${Ii}`);const h=[];let w=0;for(let U=0;U<Ii;++U){const V=U/v,S=Math.exp(-V*V/2);h.push(S),U===0?w+=S:U<_&&(w+=2*S)}for(let U=0;U<h.length;U++)h[U]=h[U]/w;p.envMap.value=e.texture,p.samples.value=_,p.weights.value=h,p.latitudinal.value=o==="latitudinal",c&&(p.poleAxis.value=c);const{_lodMax:T}=this;p.dTheta.value=y,p.mipInt.value=T-i;const A=this._sizeLods[s],I=3*A*(s>T-ti?s-T+ti:0),P=4*(this._cubeSize-A);Qi(t,I,P,3*A,2*A),l.setRenderTarget(t),l.render(f,$r)}}function i_(n){const e=[],t=[],i=[];let s=n;const a=n-ti+1+yl.length;for(let o=0;o<a;o++){const c=Math.pow(2,s);e.push(c);let l=1/c;o>n-ti?l=yl[o-n+ti-1]:o===0&&(l=0),t.push(l);const u=1/(c-2),d=-u,f=1+u,p=[d,d,f,d,f,f,d,d,f,f,d,f],m=6,y=6,v=3,_=2,h=1,w=new Float32Array(v*y*m),T=new Float32Array(_*y*m),A=new Float32Array(h*y*m);for(let P=0;P<m;P++){const U=P%3*2/3-1,V=P>2?0:-1,S=[U,V,0,U+2/3,V,0,U+2/3,V+1,0,U,V,0,U+2/3,V+1,0,U,V+1,0];w.set(S,v*y*P),T.set(p,_*y*P);const b=[P,P,P,P,P,P];A.set(b,h*y*P)}const I=new Hn;I.setAttribute("position",new Mn(w,v)),I.setAttribute("uv",new Mn(T,_)),I.setAttribute("faceIndex",new Mn(A,h)),i.push(new pn(I,null)),s>ti&&s--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Sl(n,e,t){const i=new bn(n,e,t);return i.texture.mapping=ya,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Qi(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function r_(n,e,t){return new Tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:t_,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:xa(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 3.2: Transform view direction to hemisphere configuration
				vec3 Vh = normalize(vec3(alpha * V.x, alpha * V.y, V.z));

				// Section 4.1: Orthonormal basis
				float lensq = Vh.x * Vh.x + Vh.y * Vh.y;
				vec3 T1 = lensq > 0.0 ? vec3(-Vh.y, Vh.x, 0.0) / sqrt(lensq) : vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(Vh, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + Vh.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * Vh;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function s_(n,e,t){const i=new Float32Array(Ii),s=new O(0,1,0);return new Tn({name:"SphericalGaussianBlur",defines:{n:Ii,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:xa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function bl(){return new Tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:xa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function Ml(){return new Tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:xa(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:On,depthTest:!1,depthWrite:!1})}function xa(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function a_(n){let e=new WeakMap,t=null;function i(c){if(c&&c.isTexture){const l=c.mapping,u=l===mo||l===_o,d=l===Oi||l===Nr;if(u||d){let f=e.get(c);const p=f!==void 0?f.texture.pmremVersion:0;if(c.isRenderTargetTexture&&c.pmremVersion!==p)return t===null&&(t=new vl(n)),f=u?t.fromEquirectangular(c,f):t.fromCubemap(c,f),f.texture.pmremVersion=c.pmremVersion,e.set(c,f),f.texture;if(f!==void 0)return f.texture;{const m=c.image;return u&&m&&m.height>0||d&&m&&s(m)?(t===null&&(t=new vl(n)),f=u?t.fromEquirectangular(c):t.fromCubemap(c),f.texture.pmremVersion=c.pmremVersion,e.set(c,f),c.addEventListener("dispose",a),f.texture):null}}}return c}function s(c){let l=0;const u=6;for(let d=0;d<u;d++)c[d]!==void 0&&l++;return l===u}function a(c){const l=c.target;l.removeEventListener("dispose",a);const u=e.get(l);u!==void 0&&(e.delete(l),u.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:i,dispose:o}}function o_(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const s=n.getExtension(i);return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const s=t(i);return s===null&&us("WebGLRenderer: "+i+" extension not supported."),s}}}function c_(n,e,t,i){const s={},a=new WeakMap;function o(f){const p=f.target;p.index!==null&&e.remove(p.index);for(const y in p.attributes)e.remove(p.attributes[y]);p.removeEventListener("dispose",o),delete s[p.id];const m=a.get(p);m&&(e.remove(m),a.delete(p)),i.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function c(f,p){return s[p.id]===!0||(p.addEventListener("dispose",o),s[p.id]=!0,t.memory.geometries++),p}function l(f){const p=f.attributes;for(const m in p)e.update(p[m],n.ARRAY_BUFFER)}function u(f){const p=[],m=f.index,y=f.attributes.position;let v=0;if(m!==null){const w=m.array;v=m.version;for(let T=0,A=w.length;T<A;T+=3){const I=w[T+0],P=w[T+1],U=w[T+2];p.push(I,P,P,U,U,I)}}else if(y!==void 0){const w=y.array;v=y.version;for(let T=0,A=w.length/3-1;T<A;T+=3){const I=T+0,P=T+1,U=T+2;p.push(I,P,P,U,U,I)}}else return;const _=new(Lu(p)?Vu:ku)(p,1);_.version=v;const h=a.get(f);h&&e.remove(h),a.set(f,_)}function d(f){const p=a.get(f);if(p){const m=f.index;m!==null&&p.version<m.version&&u(f)}else u(f);return a.get(f)}return{get:c,update:l,getWireframeAttribute:d}}function l_(n,e,t){let i;function s(p){i=p}let a,o;function c(p){a=p.type,o=p.bytesPerElement}function l(p,m){n.drawElements(i,m,a,p*o),t.update(m,i,1)}function u(p,m,y){y!==0&&(n.drawElementsInstanced(i,m,a,p*o,y),t.update(m,i,y))}function d(p,m,y){if(y===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,m,0,a,p,0,y);let _=0;for(let h=0;h<y;h++)_+=m[h];t.update(_,i,1)}function f(p,m,y,v){if(y===0)return;const _=e.get("WEBGL_multi_draw");if(_===null)for(let h=0;h<p.length;h++)u(p[h]/o,m[h],v[h]);else{_.multiDrawElementsInstancedWEBGL(i,m,0,a,p,0,v,0,y);let h=0;for(let w=0;w<y;w++)h+=m[w]*v[w];t.update(h,i,1)}}this.setMode=s,this.setIndex=c,this.render=l,this.renderInstances=u,this.renderMultiDraw=d,this.renderMultiDrawInstances=f}function u_(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,o,c){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=c*(a/3);break;case n.LINES:t.lines+=c*(a/2);break;case n.LINE_STRIP:t.lines+=c*(a-1);break;case n.LINE_LOOP:t.lines+=c*a;break;case n.POINTS:t.points+=c*a;break;default:nt("WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function d_(n,e,t){const i=new WeakMap,s=new wt;function a(o,c,l){const u=o.morphTargetInfluences,d=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,f=d!==void 0?d.length:0;let p=i.get(c);if(p===void 0||p.count!==f){let b=function(){V.dispose(),i.delete(c),c.removeEventListener("dispose",b)};var m=b;p!==void 0&&p.texture.dispose();const y=c.morphAttributes.position!==void 0,v=c.morphAttributes.normal!==void 0,_=c.morphAttributes.color!==void 0,h=c.morphAttributes.position||[],w=c.morphAttributes.normal||[],T=c.morphAttributes.color||[];let A=0;y===!0&&(A=1),v===!0&&(A=2),_===!0&&(A=3);let I=c.attributes.position.count*A,P=1;I>e.maxTextureSize&&(P=Math.ceil(I/e.maxTextureSize),I=e.maxTextureSize);const U=new Float32Array(I*P*4*f),V=new Nu(U,I,P,f);V.type=xn,V.needsUpdate=!0;const S=A*4;for(let L=0;L<f;L++){const q=h[L],H=w[L],J=T[L],Y=I*P*4*L;for(let X=0;X<q.count;X++){const G=X*S;y===!0&&(s.fromBufferAttribute(q,X),U[Y+G+0]=s.x,U[Y+G+1]=s.y,U[Y+G+2]=s.z,U[Y+G+3]=0),v===!0&&(s.fromBufferAttribute(H,X),U[Y+G+4]=s.x,U[Y+G+5]=s.y,U[Y+G+6]=s.z,U[Y+G+7]=0),_===!0&&(s.fromBufferAttribute(J,X),U[Y+G+8]=s.x,U[Y+G+9]=s.y,U[Y+G+10]=s.z,U[Y+G+11]=J.itemSize===4?s.w:1)}}p={count:f,texture:V,size:new at(I,P)},i.set(c,p),c.addEventListener("dispose",b)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let y=0;for(let _=0;_<u.length;_++)y+=u[_];const v=c.morphTargetsRelative?1:1-y;l.getUniforms().setValue(n,"morphTargetBaseInfluence",v),l.getUniforms().setValue(n,"morphTargetInfluences",u)}l.getUniforms().setValue(n,"morphTargetsTexture",p.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",p.size)}return{update:a}}function h_(n,e,t,i){let s=new WeakMap;function a(l){const u=i.render.frame,d=l.geometry,f=e.get(l,d);if(s.get(f)!==u&&(e.update(f),s.set(f,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==u&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,u))),l.isSkinnedMesh){const p=l.skeleton;s.get(p)!==u&&(p.update(),s.set(p,u))}return f}function o(){s=new WeakMap}function c(l){const u=l.target;u.removeEventListener("dispose",c),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}const f_={[yu]:"LINEAR_TONE_MAPPING",[xu]:"REINHARD_TONE_MAPPING",[vu]:"CINEON_TONE_MAPPING",[Su]:"ACES_FILMIC_TONE_MAPPING",[Mu]:"AGX_TONE_MAPPING",[wu]:"NEUTRAL_TONE_MAPPING",[bu]:"CUSTOM_TONE_MAPPING"};function p_(n,e,t,i,s){const a=new bn(e,t,{type:n,depthBuffer:i,stencilBuffer:s}),o=new bn(e,t,{type:zn,depthBuffer:!1,stencilBuffer:!1}),c=new Hn;c.setAttribute("position",new Vn([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Vn([0,2,0,0,2,0],2));const l=new sf({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),u=new pn(c,l),d=new Ic(-1,1,1,-1,0,1);let f=null,p=null,m=!1,y,v=null,_=[],h=!1;this.setSize=function(w,T){a.setSize(w,T),o.setSize(w,T);for(let A=0;A<_.length;A++){const I=_[A];I.setSize&&I.setSize(w,T)}},this.setEffects=function(w){_=w,h=_.length>0&&_[0].isRenderPass===!0;const T=a.width,A=a.height;for(let I=0;I<_.length;I++){const P=_[I];P.setSize&&P.setSize(T,A)}},this.begin=function(w,T){if(m||w.toneMapping===Sn&&_.length===0)return!1;if(v=T,T!==null){const A=T.width,I=T.height;(a.width!==A||a.height!==I)&&this.setSize(A,I)}return h===!1&&w.setRenderTarget(a),y=w.toneMapping,w.toneMapping=Sn,!0},this.hasRenderPass=function(){return h},this.end=function(w,T){w.toneMapping=y,m=!0;let A=a,I=o;for(let P=0;P<_.length;P++){const U=_[P];if(U.enabled!==!1&&(U.render(w,I,A,T),U.needsSwap!==!1)){const V=A;A=I,I=V}}if(f!==w.outputColorSpace||p!==w.toneMapping){f=w.outputColorSpace,p=w.toneMapping,l.defines={},Qe.getTransfer(f)===ft&&(l.defines.SRGB_TRANSFER="");const P=f_[p];P&&(l.defines[P]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=A.texture,w.setRenderTarget(v),w.render(u,d),v=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o.dispose(),c.dispose(),l.dispose()}}const ju=new Wt,Jo=new ds(1,1),Yu=new Nu,$u=new Dh,Zu=new Hu,wl=[],El=[],Tl=new Float32Array(16),Al=new Float32Array(9),Il=new Float32Array(4);function Hr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const s=e*t;let a=wl[s];if(a===void 0&&(a=new Float32Array(s),wl[s]=a),e!==0){i.toArray(a,0);for(let o=1,c=0;o!==e;++o)c+=t,n[o].toArray(a,c)}return a}function Ut(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Dt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function va(n,e){let t=El[e];t===void 0&&(t=new Int32Array(e),El[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function m_(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function __(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;n.uniform2fv(this.addr,e),Dt(t,e)}}function g_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ut(t,e))return;n.uniform3fv(this.addr,e),Dt(t,e)}}function y_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;n.uniform4fv(this.addr,e),Dt(t,e)}}function x_(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Dt(t,e)}else{if(Ut(t,i))return;Il.set(i),n.uniformMatrix2fv(this.addr,!1,Il),Dt(t,i)}}function v_(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Dt(t,e)}else{if(Ut(t,i))return;Al.set(i),n.uniformMatrix3fv(this.addr,!1,Al),Dt(t,i)}}function S_(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(Ut(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Dt(t,e)}else{if(Ut(t,i))return;Tl.set(i),n.uniformMatrix4fv(this.addr,!1,Tl),Dt(t,i)}}function b_(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function M_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;n.uniform2iv(this.addr,e),Dt(t,e)}}function w_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;n.uniform3iv(this.addr,e),Dt(t,e)}}function E_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;n.uniform4iv(this.addr,e),Dt(t,e)}}function T_(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function A_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ut(t,e))return;n.uniform2uiv(this.addr,e),Dt(t,e)}}function I_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ut(t,e))return;n.uniform3uiv(this.addr,e),Dt(t,e)}}function R_(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ut(t,e))return;n.uniform4uiv(this.addr,e),Dt(t,e)}}function C_(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let a;this.type===n.SAMPLER_2D_SHADOW?(Jo.compareFunction=t.isReversedDepthBuffer()?wc:Mc,a=Jo):a=ju,t.setTexture2D(e||a,s)}function P_(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||$u,s)}function U_(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||Zu,s)}function D_(n,e,t){const i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||Yu,s)}function L_(n){switch(n){case 5126:return m_;case 35664:return __;case 35665:return g_;case 35666:return y_;case 35674:return x_;case 35675:return v_;case 35676:return S_;case 5124:case 35670:return b_;case 35667:case 35671:return M_;case 35668:case 35672:return w_;case 35669:case 35673:return E_;case 5125:return T_;case 36294:return A_;case 36295:return I_;case 36296:return R_;case 35678:case 36198:case 36298:case 36306:case 35682:return C_;case 35679:case 36299:case 36307:return P_;case 35680:case 36300:case 36308:case 36293:return U_;case 36289:case 36303:case 36311:case 36292:return D_}}function N_(n,e){n.uniform1fv(this.addr,e)}function F_(n,e){const t=Hr(e,this.size,2);n.uniform2fv(this.addr,t)}function B_(n,e){const t=Hr(e,this.size,3);n.uniform3fv(this.addr,t)}function O_(n,e){const t=Hr(e,this.size,4);n.uniform4fv(this.addr,t)}function k_(n,e){const t=Hr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function V_(n,e){const t=Hr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function z_(n,e){const t=Hr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function G_(n,e){n.uniform1iv(this.addr,e)}function H_(n,e){n.uniform2iv(this.addr,e)}function W_(n,e){n.uniform3iv(this.addr,e)}function q_(n,e){n.uniform4iv(this.addr,e)}function K_(n,e){n.uniform1uiv(this.addr,e)}function X_(n,e){n.uniform2uiv(this.addr,e)}function j_(n,e){n.uniform3uiv(this.addr,e)}function Y_(n,e){n.uniform4uiv(this.addr,e)}function $_(n,e,t){const i=this.cache,s=e.length,a=va(t,s);Ut(i,a)||(n.uniform1iv(this.addr,a),Dt(i,a));let o;this.type===n.SAMPLER_2D_SHADOW?o=Jo:o=ju;for(let c=0;c!==s;++c)t.setTexture2D(e[c]||o,a[c])}function Z_(n,e,t){const i=this.cache,s=e.length,a=va(t,s);Ut(i,a)||(n.uniform1iv(this.addr,a),Dt(i,a));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||$u,a[o])}function J_(n,e,t){const i=this.cache,s=e.length,a=va(t,s);Ut(i,a)||(n.uniform1iv(this.addr,a),Dt(i,a));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||Zu,a[o])}function Q_(n,e,t){const i=this.cache,s=e.length,a=va(t,s);Ut(i,a)||(n.uniform1iv(this.addr,a),Dt(i,a));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Yu,a[o])}function eg(n){switch(n){case 5126:return N_;case 35664:return F_;case 35665:return B_;case 35666:return O_;case 35674:return k_;case 35675:return V_;case 35676:return z_;case 5124:case 35670:return G_;case 35667:case 35671:return H_;case 35668:case 35672:return W_;case 35669:case 35673:return q_;case 5125:return K_;case 36294:return X_;case 36295:return j_;case 36296:return Y_;case 35678:case 36198:case 36298:case 36306:case 35682:return $_;case 35679:case 36299:case 36307:return Z_;case 35680:case 36300:case 36308:case 36293:return J_;case 36289:case 36303:case 36311:case 36292:return Q_}}class tg{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=L_(t.type)}}class ng{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=eg(t.type)}}class ig{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const s=this.seq;for(let a=0,o=s.length;a!==o;++a){const c=s[a];c.setValue(e,t[c.id],i)}}}const io=/(\w+)(\])?(\[|\.)?/g;function Rl(n,e){n.seq.push(e),n.map[e.id]=e}function rg(n,e,t){const i=n.name,s=i.length;for(io.lastIndex=0;;){const a=io.exec(i),o=io.lastIndex;let c=a[1];const l=a[2]==="]",u=a[3];if(l&&(c=c|0),u===void 0||u==="["&&o+2===s){Rl(t,u===void 0?new tg(c,n,e):new ng(c,n,e));break}else{let f=t.map[c];f===void 0&&(f=new ig(c),Rl(t,f)),t=f}}}class ia{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const c=e.getActiveUniform(t,o),l=e.getUniformLocation(t,c.name);rg(c,l,this)}const s=[],a=[];for(const o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(o):a.push(o);s.length>0&&(this.seq=s.concat(a))}setValue(e,t,i,s){const a=this.map[t];a!==void 0&&a.setValue(e,i,s)}setOptional(e,t,i){const s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let a=0,o=t.length;a!==o;++a){const c=t[a],l=i[c.id];l.needsUpdate!==!1&&c.setValue(e,l.value,s)}}static seqWithValue(e,t){const i=[];for(let s=0,a=e.length;s!==a;++s){const o=e[s];o.id in t&&i.push(o)}return i}}function Cl(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const sg=37297;let ag=0;function og(n,e){const t=n.split(`
`),i=[],s=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let o=s;o<a;o++){const c=o+1;i.push(`${c===e?">":" "} ${c}: ${t[o]}`)}return i.join(`
`)}const Pl=new He;function cg(n){Qe._getMatrix(Pl,Qe.workingColorSpace,n);const e=`mat3( ${Pl.elements.map(t=>t.toFixed(4))} )`;switch(Qe.getTransfer(n)){case sa:return[e,"LinearTransferOETF"];case ft:return[e,"sRGBTransferOETF"];default:return Ve("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Ul(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),a=(n.getShaderInfoLog(e)||"").trim();if(i&&a==="")return"";const o=/ERROR: 0:(\d+)/.exec(a);if(o){const c=parseInt(o[1]);return t.toUpperCase()+`

`+a+`

`+og(n.getShaderSource(e),c)}else return a}function lg(n,e){const t=cg(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const ug={[yu]:"Linear",[xu]:"Reinhard",[vu]:"Cineon",[Su]:"ACESFilmic",[Mu]:"AgX",[wu]:"Neutral",[bu]:"Custom"};function dg(n,e){const t=ug[e];return t===void 0?(Ve("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Zs=new O;function hg(){Qe.getLuminanceCoefficients(Zs);const n=Zs.x.toFixed(4),e=Zs.y.toFixed(4),t=Zs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function fg(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(is).join(`
`)}function pg(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function mg(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){const a=n.getActiveAttrib(e,s),o=a.name;let c=1;a.type===n.FLOAT_MAT2&&(c=2),a.type===n.FLOAT_MAT3&&(c=3),a.type===n.FLOAT_MAT4&&(c=4),t[o]={type:a.type,location:n.getAttribLocation(e,o),locationSize:c}}return t}function is(n){return n!==""}function Dl(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ll(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const _g=/^[ \t]*#include +<([\w\d./]+)>/gm;function Qo(n){return n.replace(_g,yg)}const gg=new Map;function yg(n,e){let t=We[e];if(t===void 0){const i=gg.get(e);if(i!==void 0)t=We[i],Ve('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return Qo(t)}const xg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Nl(n){return n.replace(xg,vg)}function vg(n,e,t,i){let s="";for(let a=parseInt(e);a<parseInt(t);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function Fl(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Sg={[Js]:"SHADOWMAP_TYPE_PCF",[ns]:"SHADOWMAP_TYPE_VSM"};function bg(n){return Sg[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Mg={[Oi]:"ENVMAP_TYPE_CUBE",[Nr]:"ENVMAP_TYPE_CUBE",[ya]:"ENVMAP_TYPE_CUBE_UV"};function wg(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Mg[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const Eg={[Nr]:"ENVMAP_MODE_REFRACTION"};function Tg(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Eg[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Ag={[gu]:"ENVMAP_BLENDING_MULTIPLY",[ph]:"ENVMAP_BLENDING_MIX",[mh]:"ENVMAP_BLENDING_ADD"};function Ig(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Ag[n.combine]||"ENVMAP_BLENDING_NONE"}function Rg(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Cg(n,e,t,i){const s=n.getContext(),a=t.defines;let o=t.vertexShader,c=t.fragmentShader;const l=bg(t),u=wg(t),d=Tg(t),f=Ig(t),p=Rg(t),m=fg(t),y=pg(a),v=s.createProgram();let _,h,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(_=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y].filter(is).join(`
`),_.length>0&&(_+=`
`),h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y].filter(is).join(`
`),h.length>0&&(h+=`
`)):(_=[Fl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(is).join(`
`),h=[Fl(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,y,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",t.envMap?"#define "+f:"",p?"#define CUBEUV_TEXEL_WIDTH "+p.texelWidth:"",p?"#define CUBEUV_TEXEL_HEIGHT "+p.texelHeight:"",p?"#define CUBEUV_MAX_MIP "+p.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Sn?"#define TONE_MAPPING":"",t.toneMapping!==Sn?We.tonemapping_pars_fragment:"",t.toneMapping!==Sn?dg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",We.colorspace_pars_fragment,lg("linearToOutputTexel",t.outputColorSpace),hg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(is).join(`
`)),o=Qo(o),o=Dl(o,t),o=Ll(o,t),c=Qo(c),c=Dl(c,t),c=Ll(c,t),o=Nl(o),c=Nl(c),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,_=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,h=["#define varying in",t.glslVersion===Yc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Yc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+h);const T=w+_+o,A=w+h+c,I=Cl(s,s.VERTEX_SHADER,T),P=Cl(s,s.FRAGMENT_SHADER,A);s.attachShader(v,I),s.attachShader(v,P),t.index0AttributeName!==void 0?s.bindAttribLocation(v,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function U(L){if(n.debug.checkShaderErrors){const q=s.getProgramInfoLog(v)||"",H=s.getShaderInfoLog(I)||"",J=s.getShaderInfoLog(P)||"",Y=q.trim(),X=H.trim(),G=J.trim();let te=!0,_e=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(te=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,v,I,P);else{const he=Ul(s,I,"vertex"),ge=Ul(s,P,"fragment");nt("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+Y+`
`+he+`
`+ge)}else Y!==""?Ve("WebGLProgram: Program Info Log:",Y):(X===""||G==="")&&(_e=!1);_e&&(L.diagnostics={runnable:te,programLog:Y,vertexShader:{log:X,prefix:_},fragmentShader:{log:G,prefix:h}})}s.deleteShader(I),s.deleteShader(P),V=new ia(s,v),S=mg(s,v)}let V;this.getUniforms=function(){return V===void 0&&U(this),V};let S;this.getAttributes=function(){return S===void 0&&U(this),S};let b=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return b===!1&&(b=s.getProgramParameter(v,sg)),b},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=ag++,this.cacheKey=e,this.usedTimes=1,this.program=v,this.vertexShader=I,this.fragmentShader=P,this}let Pg=0;class Ug{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,s=this._getShaderStage(t),a=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(a)===!1&&(o.add(a),a.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new Dg(e),t.set(e,i)),i}}class Dg{constructor(e){this.id=Pg++,this.code=e,this.usedTimes=0}}function Lg(n,e,t,i,s,a,o){const c=new Fu,l=new Ug,u=new Set,d=[],f=new Map,p=s.logarithmicDepthBuffer;let m=s.precision;const y={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(S){return u.add(S),S===0?"uv":`uv${S}`}function _(S,b,L,q,H){const J=q.fog,Y=H.geometry,X=S.isMeshStandardMaterial?q.environment:null,G=(S.isMeshStandardMaterial?t:e).get(S.envMap||X),te=G&&G.mapping===ya?G.image.height:null,_e=y[S.type];S.precision!==null&&(m=s.getMaxPrecision(S.precision),m!==S.precision&&Ve("WebGLProgram.getParameters:",S.precision,"not supported, using",m,"instead."));const he=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,ge=he!==void 0?he.length:0;let je=0;Y.morphAttributes.position!==void 0&&(je=1),Y.morphAttributes.normal!==void 0&&(je=2),Y.morphAttributes.color!==void 0&&(je=3);let qe,St,vt,$;if(_e){const ut=yn[_e];qe=ut.vertexShader,St=ut.fragmentShader}else qe=S.vertexShader,St=S.fragmentShader,l.update(S),vt=l.getVertexShaderID(S),$=l.getFragmentShaderID(S);const ne=n.getRenderTarget(),Se=n.state.buffers.depth.getReversed(),ze=H.isInstancedMesh===!0,Ee=H.isBatchedMesh===!0,et=!!S.map,Lt=!!S.matcap,Je=!!G,lt=!!S.aoMap,mt=!!S.lightMap,Ke=!!S.bumpMap,It=!!S.normalMap,C=!!S.displacementMap,Rt=!!S.emissiveMap,ot=!!S.metalnessMap,gt=!!S.roughnessMap,Ae=S.anisotropy>0,M=S.clearcoat>0,g=S.dispersion>0,N=S.iridescence>0,j=S.sheen>0,ee=S.transmission>0,K=Ae&&!!S.anisotropyMap,Ce=M&&!!S.clearcoatMap,oe=M&&!!S.clearcoatNormalMap,Te=M&&!!S.clearcoatRoughnessMap,Oe=N&&!!S.iridescenceMap,re=N&&!!S.iridescenceThicknessMap,ue=j&&!!S.sheenColorMap,we=j&&!!S.sheenRoughnessMap,Ie=!!S.specularMap,ce=!!S.specularColorMap,Xe=!!S.specularIntensityMap,D=ee&&!!S.transmissionMap,me=ee&&!!S.thicknessMap,se=!!S.gradientMap,ye=!!S.alphaMap,ie=S.alphaTest>0,Q=!!S.alphaHash,ae=!!S.extensions;let ke=Sn;S.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(ke=n.toneMapping);const yt={shaderID:_e,shaderType:S.type,shaderName:S.name,vertexShader:qe,fragmentShader:St,defines:S.defines,customVertexShaderID:vt,customFragmentShaderID:$,isRawShaderMaterial:S.isRawShaderMaterial===!0,glslVersion:S.glslVersion,precision:m,batching:Ee,batchingColor:Ee&&H._colorsTexture!==null,instancing:ze,instancingColor:ze&&H.instanceColor!==null,instancingMorph:ze&&H.morphTexture!==null,outputColorSpace:ne===null?n.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Br,alphaToCoverage:!!S.alphaToCoverage,map:et,matcap:Lt,envMap:Je,envMapMode:Je&&G.mapping,envMapCubeUVHeight:te,aoMap:lt,lightMap:mt,bumpMap:Ke,normalMap:It,displacementMap:C,emissiveMap:Rt,normalMapObjectSpace:It&&S.normalMapType===yh,normalMapTangentSpace:It&&S.normalMapType===Du,metalnessMap:ot,roughnessMap:gt,anisotropy:Ae,anisotropyMap:K,clearcoat:M,clearcoatMap:Ce,clearcoatNormalMap:oe,clearcoatRoughnessMap:Te,dispersion:g,iridescence:N,iridescenceMap:Oe,iridescenceThicknessMap:re,sheen:j,sheenColorMap:ue,sheenRoughnessMap:we,specularMap:Ie,specularColorMap:ce,specularIntensityMap:Xe,transmission:ee,transmissionMap:D,thicknessMap:me,gradientMap:se,opaque:S.transparent===!1&&S.blending===wr&&S.alphaToCoverage===!1,alphaMap:ye,alphaTest:ie,alphaHash:Q,combine:S.combine,mapUv:et&&v(S.map.channel),aoMapUv:lt&&v(S.aoMap.channel),lightMapUv:mt&&v(S.lightMap.channel),bumpMapUv:Ke&&v(S.bumpMap.channel),normalMapUv:It&&v(S.normalMap.channel),displacementMapUv:C&&v(S.displacementMap.channel),emissiveMapUv:Rt&&v(S.emissiveMap.channel),metalnessMapUv:ot&&v(S.metalnessMap.channel),roughnessMapUv:gt&&v(S.roughnessMap.channel),anisotropyMapUv:K&&v(S.anisotropyMap.channel),clearcoatMapUv:Ce&&v(S.clearcoatMap.channel),clearcoatNormalMapUv:oe&&v(S.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Te&&v(S.clearcoatRoughnessMap.channel),iridescenceMapUv:Oe&&v(S.iridescenceMap.channel),iridescenceThicknessMapUv:re&&v(S.iridescenceThicknessMap.channel),sheenColorMapUv:ue&&v(S.sheenColorMap.channel),sheenRoughnessMapUv:we&&v(S.sheenRoughnessMap.channel),specularMapUv:Ie&&v(S.specularMap.channel),specularColorMapUv:ce&&v(S.specularColorMap.channel),specularIntensityMapUv:Xe&&v(S.specularIntensityMap.channel),transmissionMapUv:D&&v(S.transmissionMap.channel),thicknessMapUv:me&&v(S.thicknessMap.channel),alphaMapUv:ye&&v(S.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(It||Ae),vertexColors:S.vertexColors,vertexAlphas:S.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!Y.attributes.uv&&(et||ye),fog:!!J,useFog:S.fog===!0,fogExp2:!!J&&J.isFogExp2,flatShading:S.flatShading===!0&&S.wireframe===!1,sizeAttenuation:S.sizeAttenuation===!0,logarithmicDepthBuffer:p,reversedDepthBuffer:Se,skinning:H.isSkinnedMesh===!0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:je,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:S.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:ke,decodeVideoTexture:et&&S.map.isVideoTexture===!0&&Qe.getTransfer(S.map.colorSpace)===ft,decodeVideoTextureEmissive:Rt&&S.emissiveMap.isVideoTexture===!0&&Qe.getTransfer(S.emissiveMap.colorSpace)===ft,premultipliedAlpha:S.premultipliedAlpha,doubleSided:S.side===Nn,flipSided:S.side===Yt,useDepthPacking:S.depthPacking>=0,depthPacking:S.depthPacking||0,index0AttributeName:S.index0AttributeName,extensionClipCullDistance:ae&&S.extensions.clipCullDistance===!0&&i.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&S.extensions.multiDraw===!0||Ee)&&i.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:S.customProgramCacheKey()};return yt.vertexUv1s=u.has(1),yt.vertexUv2s=u.has(2),yt.vertexUv3s=u.has(3),u.clear(),yt}function h(S){const b=[];if(S.shaderID?b.push(S.shaderID):(b.push(S.customVertexShaderID),b.push(S.customFragmentShaderID)),S.defines!==void 0)for(const L in S.defines)b.push(L),b.push(S.defines[L]);return S.isRawShaderMaterial===!1&&(w(b,S),T(b,S),b.push(n.outputColorSpace)),b.push(S.customProgramCacheKey),b.join()}function w(S,b){S.push(b.precision),S.push(b.outputColorSpace),S.push(b.envMapMode),S.push(b.envMapCubeUVHeight),S.push(b.mapUv),S.push(b.alphaMapUv),S.push(b.lightMapUv),S.push(b.aoMapUv),S.push(b.bumpMapUv),S.push(b.normalMapUv),S.push(b.displacementMapUv),S.push(b.emissiveMapUv),S.push(b.metalnessMapUv),S.push(b.roughnessMapUv),S.push(b.anisotropyMapUv),S.push(b.clearcoatMapUv),S.push(b.clearcoatNormalMapUv),S.push(b.clearcoatRoughnessMapUv),S.push(b.iridescenceMapUv),S.push(b.iridescenceThicknessMapUv),S.push(b.sheenColorMapUv),S.push(b.sheenRoughnessMapUv),S.push(b.specularMapUv),S.push(b.specularColorMapUv),S.push(b.specularIntensityMapUv),S.push(b.transmissionMapUv),S.push(b.thicknessMapUv),S.push(b.combine),S.push(b.fogExp2),S.push(b.sizeAttenuation),S.push(b.morphTargetsCount),S.push(b.morphAttributeCount),S.push(b.numDirLights),S.push(b.numPointLights),S.push(b.numSpotLights),S.push(b.numSpotLightMaps),S.push(b.numHemiLights),S.push(b.numRectAreaLights),S.push(b.numDirLightShadows),S.push(b.numPointLightShadows),S.push(b.numSpotLightShadows),S.push(b.numSpotLightShadowsWithMaps),S.push(b.numLightProbes),S.push(b.shadowMapType),S.push(b.toneMapping),S.push(b.numClippingPlanes),S.push(b.numClipIntersection),S.push(b.depthPacking)}function T(S,b){c.disableAll(),b.instancing&&c.enable(0),b.instancingColor&&c.enable(1),b.instancingMorph&&c.enable(2),b.matcap&&c.enable(3),b.envMap&&c.enable(4),b.normalMapObjectSpace&&c.enable(5),b.normalMapTangentSpace&&c.enable(6),b.clearcoat&&c.enable(7),b.iridescence&&c.enable(8),b.alphaTest&&c.enable(9),b.vertexColors&&c.enable(10),b.vertexAlphas&&c.enable(11),b.vertexUv1s&&c.enable(12),b.vertexUv2s&&c.enable(13),b.vertexUv3s&&c.enable(14),b.vertexTangents&&c.enable(15),b.anisotropy&&c.enable(16),b.alphaHash&&c.enable(17),b.batching&&c.enable(18),b.dispersion&&c.enable(19),b.batchingColor&&c.enable(20),b.gradientMap&&c.enable(21),S.push(c.mask),c.disableAll(),b.fog&&c.enable(0),b.useFog&&c.enable(1),b.flatShading&&c.enable(2),b.logarithmicDepthBuffer&&c.enable(3),b.reversedDepthBuffer&&c.enable(4),b.skinning&&c.enable(5),b.morphTargets&&c.enable(6),b.morphNormals&&c.enable(7),b.morphColors&&c.enable(8),b.premultipliedAlpha&&c.enable(9),b.shadowMapEnabled&&c.enable(10),b.doubleSided&&c.enable(11),b.flipSided&&c.enable(12),b.useDepthPacking&&c.enable(13),b.dithering&&c.enable(14),b.transmission&&c.enable(15),b.sheen&&c.enable(16),b.opaque&&c.enable(17),b.pointsUvs&&c.enable(18),b.decodeVideoTexture&&c.enable(19),b.decodeVideoTextureEmissive&&c.enable(20),b.alphaToCoverage&&c.enable(21),S.push(c.mask)}function A(S){const b=y[S.type];let L;if(b){const q=yn[b];L=Xh.clone(q.uniforms)}else L=S.uniforms;return L}function I(S,b){let L=f.get(b);return L!==void 0?++L.usedTimes:(L=new Cg(n,b,S,a),d.push(L),f.set(b,L)),L}function P(S){if(--S.usedTimes===0){const b=d.indexOf(S);d[b]=d[d.length-1],d.pop(),f.delete(S.cacheKey),S.destroy()}}function U(S){l.remove(S)}function V(){l.dispose()}return{getParameters:_,getProgramCacheKey:h,getUniforms:A,acquireProgram:I,releaseProgram:P,releaseShaderCache:U,programs:d,dispose:V}}function Ng(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let c=n.get(o);return c===void 0&&(c={},n.set(o,c)),c}function i(o){n.delete(o)}function s(o,c,l){n.get(o)[c]=l}function a(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:a}}function Fg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.z!==e.z?n.z-e.z:n.id-e.id}function Bl(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ol(){const n=[];let e=0;const t=[],i=[],s=[];function a(){e=0,t.length=0,i.length=0,s.length=0}function o(f,p,m,y,v,_){let h=n[e];return h===void 0?(h={id:f.id,object:f,geometry:p,material:m,groupOrder:y,renderOrder:f.renderOrder,z:v,group:_},n[e]=h):(h.id=f.id,h.object=f,h.geometry=p,h.material=m,h.groupOrder=y,h.renderOrder=f.renderOrder,h.z=v,h.group=_),e++,h}function c(f,p,m,y,v,_){const h=o(f,p,m,y,v,_);m.transmission>0?i.push(h):m.transparent===!0?s.push(h):t.push(h)}function l(f,p,m,y,v,_){const h=o(f,p,m,y,v,_);m.transmission>0?i.unshift(h):m.transparent===!0?s.unshift(h):t.unshift(h)}function u(f,p){t.length>1&&t.sort(f||Fg),i.length>1&&i.sort(p||Bl),s.length>1&&s.sort(p||Bl)}function d(){for(let f=e,p=n.length;f<p;f++){const m=n[f];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:s,init:a,push:c,unshift:l,finish:d,sort:u}}function Bg(){let n=new WeakMap;function e(i,s){const a=n.get(i);let o;return a===void 0?(o=new Ol,n.set(i,[o])):s>=a.length?(o=new Ol,a.push(o)):o=a[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Og(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new O,color:new it};break;case"SpotLight":t={position:new O,direction:new O,color:new it,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new it,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new it,groundColor:new it};break;case"RectAreaLight":t={color:new it,position:new O,halfWidth:new O,halfHeight:new O};break}return n[e.id]=t,t}}}function kg(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new at,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let Vg=0;function zg(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Gg(n){const e=new Og,t=kg(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let u=0;u<9;u++)i.probe.push(new O);const s=new O,a=new Et,o=new Et;function c(u){let d=0,f=0,p=0;for(let S=0;S<9;S++)i.probe[S].set(0,0,0);let m=0,y=0,v=0,_=0,h=0,w=0,T=0,A=0,I=0,P=0,U=0;u.sort(zg);for(let S=0,b=u.length;S<b;S++){const L=u[S],q=L.color,H=L.intensity,J=L.distance;let Y=null;if(L.shadow&&L.shadow.map&&(L.shadow.map.texture.format===Fr?Y=L.shadow.map.texture:Y=L.shadow.map.depthTexture||L.shadow.map.texture),L.isAmbientLight)d+=q.r*H,f+=q.g*H,p+=q.b*H;else if(L.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(L.sh.coefficients[X],H);U++}else if(L.isDirectionalLight){const X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),L.castShadow){const G=L.shadow,te=t.get(L);te.shadowIntensity=G.intensity,te.shadowBias=G.bias,te.shadowNormalBias=G.normalBias,te.shadowRadius=G.radius,te.shadowMapSize=G.mapSize,i.directionalShadow[m]=te,i.directionalShadowMap[m]=Y,i.directionalShadowMatrix[m]=L.shadow.matrix,w++}i.directional[m]=X,m++}else if(L.isSpotLight){const X=e.get(L);X.position.setFromMatrixPosition(L.matrixWorld),X.color.copy(q).multiplyScalar(H),X.distance=J,X.coneCos=Math.cos(L.angle),X.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),X.decay=L.decay,i.spot[v]=X;const G=L.shadow;if(L.map&&(i.spotLightMap[I]=L.map,I++,G.updateMatrices(L),L.castShadow&&P++),i.spotLightMatrix[v]=G.matrix,L.castShadow){const te=t.get(L);te.shadowIntensity=G.intensity,te.shadowBias=G.bias,te.shadowNormalBias=G.normalBias,te.shadowRadius=G.radius,te.shadowMapSize=G.mapSize,i.spotShadow[v]=te,i.spotShadowMap[v]=Y,A++}v++}else if(L.isRectAreaLight){const X=e.get(L);X.color.copy(q).multiplyScalar(H),X.halfWidth.set(L.width*.5,0,0),X.halfHeight.set(0,L.height*.5,0),i.rectArea[_]=X,_++}else if(L.isPointLight){const X=e.get(L);if(X.color.copy(L.color).multiplyScalar(L.intensity),X.distance=L.distance,X.decay=L.decay,L.castShadow){const G=L.shadow,te=t.get(L);te.shadowIntensity=G.intensity,te.shadowBias=G.bias,te.shadowNormalBias=G.normalBias,te.shadowRadius=G.radius,te.shadowMapSize=G.mapSize,te.shadowCameraNear=G.camera.near,te.shadowCameraFar=G.camera.far,i.pointShadow[y]=te,i.pointShadowMap[y]=Y,i.pointShadowMatrix[y]=L.shadow.matrix,T++}i.point[y]=X,y++}else if(L.isHemisphereLight){const X=e.get(L);X.skyColor.copy(L.color).multiplyScalar(H),X.groundColor.copy(L.groundColor).multiplyScalar(H),i.hemi[h]=X,h++}}_>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=fe.LTC_FLOAT_1,i.rectAreaLTC2=fe.LTC_FLOAT_2):(i.rectAreaLTC1=fe.LTC_HALF_1,i.rectAreaLTC2=fe.LTC_HALF_2)),i.ambient[0]=d,i.ambient[1]=f,i.ambient[2]=p;const V=i.hash;(V.directionalLength!==m||V.pointLength!==y||V.spotLength!==v||V.rectAreaLength!==_||V.hemiLength!==h||V.numDirectionalShadows!==w||V.numPointShadows!==T||V.numSpotShadows!==A||V.numSpotMaps!==I||V.numLightProbes!==U)&&(i.directional.length=m,i.spot.length=v,i.rectArea.length=_,i.point.length=y,i.hemi.length=h,i.directionalShadow.length=w,i.directionalShadowMap.length=w,i.pointShadow.length=T,i.pointShadowMap.length=T,i.spotShadow.length=A,i.spotShadowMap.length=A,i.directionalShadowMatrix.length=w,i.pointShadowMatrix.length=T,i.spotLightMatrix.length=A+I-P,i.spotLightMap.length=I,i.numSpotLightShadowsWithMaps=P,i.numLightProbes=U,V.directionalLength=m,V.pointLength=y,V.spotLength=v,V.rectAreaLength=_,V.hemiLength=h,V.numDirectionalShadows=w,V.numPointShadows=T,V.numSpotShadows=A,V.numSpotMaps=I,V.numLightProbes=U,i.version=Vg++)}function l(u,d){let f=0,p=0,m=0,y=0,v=0;const _=d.matrixWorldInverse;for(let h=0,w=u.length;h<w;h++){const T=u[h];if(T.isDirectionalLight){const A=i.directional[f];A.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),A.direction.sub(s),A.direction.transformDirection(_),f++}else if(T.isSpotLight){const A=i.spot[m];A.position.setFromMatrixPosition(T.matrixWorld),A.position.applyMatrix4(_),A.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),A.direction.sub(s),A.direction.transformDirection(_),m++}else if(T.isRectAreaLight){const A=i.rectArea[y];A.position.setFromMatrixPosition(T.matrixWorld),A.position.applyMatrix4(_),o.identity(),a.copy(T.matrixWorld),a.premultiply(_),o.extractRotation(a),A.halfWidth.set(T.width*.5,0,0),A.halfHeight.set(0,T.height*.5,0),A.halfWidth.applyMatrix4(o),A.halfHeight.applyMatrix4(o),y++}else if(T.isPointLight){const A=i.point[p];A.position.setFromMatrixPosition(T.matrixWorld),A.position.applyMatrix4(_),p++}else if(T.isHemisphereLight){const A=i.hemi[v];A.direction.setFromMatrixPosition(T.matrixWorld),A.direction.transformDirection(_),v++}}}return{setup:c,setupView:l,state:i}}function kl(n){const e=new Gg(n),t=[],i=[];function s(d){u.camera=d,t.length=0,i.length=0}function a(d){t.push(d)}function o(d){i.push(d)}function c(){e.setup(t)}function l(d){e.setupView(t,d)}const u={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:u,setupLights:c,setupLightsView:l,pushLight:a,pushShadow:o}}function Hg(n){let e=new WeakMap;function t(s,a=0){const o=e.get(s);let c;return o===void 0?(c=new kl(n),e.set(s,[c])):a>=o.length?(c=new kl(n),o.push(c)):c=o[a],c}function i(){e=new WeakMap}return{get:t,dispose:i}}const Wg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,qg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Kg=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],Xg=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],Vl=new Et,Zr=new O,ro=new O;function jg(n,e,t){let i=new Ac;const s=new at,a=new at,o=new wt,c=new af,l=new of,u={},d=t.maxTextureSize,f={[ii]:Yt,[Yt]:ii,[Nn]:Nn},p=new Tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new at},radius:{value:4}},vertexShader:Wg,fragmentShader:qg}),m=p.clone();m.defines.HORIZONTAL_PASS=1;const y=new Hn;y.setAttribute("position",new Mn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new pn(y,p),_=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Js;let h=this.type;this.render=function(P,U,V){if(_.enabled===!1||_.autoUpdate===!1&&_.needsUpdate===!1||P.length===0)return;P.type===Yd&&(Ve("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),P.type=Js);const S=n.getRenderTarget(),b=n.getActiveCubeFace(),L=n.getActiveMipmapLevel(),q=n.state;q.setBlending(On),q.buffers.depth.getReversed()===!0?q.buffers.color.setClear(0,0,0,0):q.buffers.color.setClear(1,1,1,1),q.buffers.depth.setTest(!0),q.setScissorTest(!1);const H=h!==this.type;H&&U.traverse(function(J){J.material&&(Array.isArray(J.material)?J.material.forEach(Y=>Y.needsUpdate=!0):J.material.needsUpdate=!0)});for(let J=0,Y=P.length;J<Y;J++){const X=P[J],G=X.shadow;if(G===void 0){Ve("WebGLShadowMap:",X,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);const te=G.getFrameExtents();if(s.multiply(te),a.copy(G.mapSize),(s.x>d||s.y>d)&&(s.x>d&&(a.x=Math.floor(d/te.x),s.x=a.x*te.x,G.mapSize.x=a.x),s.y>d&&(a.y=Math.floor(d/te.y),s.y=a.y*te.y,G.mapSize.y=a.y)),G.map===null||H===!0){if(G.map!==null&&(G.map.depthTexture!==null&&(G.map.depthTexture.dispose(),G.map.depthTexture=null),G.map.dispose()),this.type===ns){if(X.isPointLight){Ve("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}G.map=new bn(s.x,s.y,{format:Fr,type:zn,minFilter:Vt,magFilter:Vt,generateMipmaps:!1}),G.map.texture.name=X.name+".shadowMap",G.map.depthTexture=new ds(s.x,s.y,xn),G.map.depthTexture.name=X.name+".shadowMapDepth",G.map.depthTexture.format=Gn,G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=Bt,G.map.depthTexture.magFilter=Bt}else{X.isPointLight?(G.map=new Wu(s.x),G.map.depthTexture=new rf(s.x,wn)):(G.map=new bn(s.x,s.y),G.map.depthTexture=new ds(s.x,s.y,wn)),G.map.depthTexture.name=X.name+".shadowMap",G.map.depthTexture.format=Gn;const he=n.state.buffers.depth.getReversed();this.type===Js?(G.map.depthTexture.compareFunction=he?wc:Mc,G.map.depthTexture.minFilter=Vt,G.map.depthTexture.magFilter=Vt):(G.map.depthTexture.compareFunction=null,G.map.depthTexture.minFilter=Bt,G.map.depthTexture.magFilter=Bt)}G.camera.updateProjectionMatrix()}const _e=G.map.isWebGLCubeRenderTarget?6:1;for(let he=0;he<_e;he++){if(G.map.isWebGLCubeRenderTarget)n.setRenderTarget(G.map,he),n.clear();else{he===0&&(n.setRenderTarget(G.map),n.clear());const ge=G.getViewport(he);o.set(a.x*ge.x,a.y*ge.y,a.x*ge.z,a.y*ge.w),q.viewport(o)}if(X.isPointLight){const ge=G.camera,je=G.matrix,qe=X.distance||ge.far;qe!==ge.far&&(ge.far=qe,ge.updateProjectionMatrix()),Zr.setFromMatrixPosition(X.matrixWorld),ge.position.copy(Zr),ro.copy(ge.position),ro.add(Kg[he]),ge.up.copy(Xg[he]),ge.lookAt(ro),ge.updateMatrixWorld(),je.makeTranslation(-Zr.x,-Zr.y,-Zr.z),Vl.multiplyMatrices(ge.projectionMatrix,ge.matrixWorldInverse),G._frustum.setFromProjectionMatrix(Vl,ge.coordinateSystem,ge.reversedDepth)}else G.updateMatrices(X);i=G.getFrustum(),A(U,V,G.camera,X,this.type)}G.isPointLightShadow!==!0&&this.type===ns&&w(G,V),G.needsUpdate=!1}h=this.type,_.needsUpdate=!1,n.setRenderTarget(S,b,L)};function w(P,U){const V=e.update(v);p.defines.VSM_SAMPLES!==P.blurSamples&&(p.defines.VSM_SAMPLES=P.blurSamples,m.defines.VSM_SAMPLES=P.blurSamples,p.needsUpdate=!0,m.needsUpdate=!0),P.mapPass===null&&(P.mapPass=new bn(s.x,s.y,{format:Fr,type:zn})),p.uniforms.shadow_pass.value=P.map.depthTexture,p.uniforms.resolution.value=P.mapSize,p.uniforms.radius.value=P.radius,n.setRenderTarget(P.mapPass),n.clear(),n.renderBufferDirect(U,null,V,p,v,null),m.uniforms.shadow_pass.value=P.mapPass.texture,m.uniforms.resolution.value=P.mapSize,m.uniforms.radius.value=P.radius,n.setRenderTarget(P.map),n.clear(),n.renderBufferDirect(U,null,V,m,v,null)}function T(P,U,V,S){let b=null;const L=V.isPointLight===!0?P.customDistanceMaterial:P.customDepthMaterial;if(L!==void 0)b=L;else if(b=V.isPointLight===!0?l:c,n.localClippingEnabled&&U.clipShadows===!0&&Array.isArray(U.clippingPlanes)&&U.clippingPlanes.length!==0||U.displacementMap&&U.displacementScale!==0||U.alphaMap&&U.alphaTest>0||U.map&&U.alphaTest>0||U.alphaToCoverage===!0){const q=b.uuid,H=U.uuid;let J=u[q];J===void 0&&(J={},u[q]=J);let Y=J[H];Y===void 0&&(Y=b.clone(),J[H]=Y,U.addEventListener("dispose",I)),b=Y}if(b.visible=U.visible,b.wireframe=U.wireframe,S===ns?b.side=U.shadowSide!==null?U.shadowSide:U.side:b.side=U.shadowSide!==null?U.shadowSide:f[U.side],b.alphaMap=U.alphaMap,b.alphaTest=U.alphaToCoverage===!0?.5:U.alphaTest,b.map=U.map,b.clipShadows=U.clipShadows,b.clippingPlanes=U.clippingPlanes,b.clipIntersection=U.clipIntersection,b.displacementMap=U.displacementMap,b.displacementScale=U.displacementScale,b.displacementBias=U.displacementBias,b.wireframeLinewidth=U.wireframeLinewidth,b.linewidth=U.linewidth,V.isPointLight===!0&&b.isMeshDistanceMaterial===!0){const q=n.properties.get(b);q.light=V}return b}function A(P,U,V,S,b){if(P.visible===!1)return;if(P.layers.test(U.layers)&&(P.isMesh||P.isLine||P.isPoints)&&(P.castShadow||P.receiveShadow&&b===ns)&&(!P.frustumCulled||i.intersectsObject(P))){P.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,P.matrixWorld);const H=e.update(P),J=P.material;if(Array.isArray(J)){const Y=H.groups;for(let X=0,G=Y.length;X<G;X++){const te=Y[X],_e=J[te.materialIndex];if(_e&&_e.visible){const he=T(P,_e,S,b);P.onBeforeShadow(n,P,U,V,H,he,te),n.renderBufferDirect(V,null,H,he,P,te),P.onAfterShadow(n,P,U,V,H,he,te)}}}else if(J.visible){const Y=T(P,J,S,b);P.onBeforeShadow(n,P,U,V,H,Y,null),n.renderBufferDirect(V,null,H,Y,P,null),P.onAfterShadow(n,P,U,V,H,Y,null)}}const q=P.children;for(let H=0,J=q.length;H<J;H++)A(q[H],U,V,S,b)}function I(P){P.target.removeEventListener("dispose",I);for(const V in u){const S=u[V],b=P.target.uuid;b in S&&(S[b].dispose(),delete S[b])}}}const Yg={[oo]:co,[lo]:fo,[uo]:po,[Lr]:ho,[co]:oo,[fo]:lo,[po]:uo,[ho]:Lr};function $g(n,e){function t(){let D=!1;const me=new wt;let se=null;const ye=new wt(0,0,0,0);return{setMask:function(ie){se!==ie&&!D&&(n.colorMask(ie,ie,ie,ie),se=ie)},setLocked:function(ie){D=ie},setClear:function(ie,Q,ae,ke,yt){yt===!0&&(ie*=ke,Q*=ke,ae*=ke),me.set(ie,Q,ae,ke),ye.equals(me)===!1&&(n.clearColor(ie,Q,ae,ke),ye.copy(me))},reset:function(){D=!1,se=null,ye.set(-1,0,0,0)}}}function i(){let D=!1,me=!1,se=null,ye=null,ie=null;return{setReversed:function(Q){if(me!==Q){const ae=e.get("EXT_clip_control");Q?ae.clipControlEXT(ae.LOWER_LEFT_EXT,ae.ZERO_TO_ONE_EXT):ae.clipControlEXT(ae.LOWER_LEFT_EXT,ae.NEGATIVE_ONE_TO_ONE_EXT),me=Q;const ke=ie;ie=null,this.setClear(ke)}},getReversed:function(){return me},setTest:function(Q){Q?ne(n.DEPTH_TEST):Se(n.DEPTH_TEST)},setMask:function(Q){se!==Q&&!D&&(n.depthMask(Q),se=Q)},setFunc:function(Q){if(me&&(Q=Yg[Q]),ye!==Q){switch(Q){case oo:n.depthFunc(n.NEVER);break;case co:n.depthFunc(n.ALWAYS);break;case lo:n.depthFunc(n.LESS);break;case Lr:n.depthFunc(n.LEQUAL);break;case uo:n.depthFunc(n.EQUAL);break;case ho:n.depthFunc(n.GEQUAL);break;case fo:n.depthFunc(n.GREATER);break;case po:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ye=Q}},setLocked:function(Q){D=Q},setClear:function(Q){ie!==Q&&(me&&(Q=1-Q),n.clearDepth(Q),ie=Q)},reset:function(){D=!1,se=null,ye=null,ie=null,me=!1}}}function s(){let D=!1,me=null,se=null,ye=null,ie=null,Q=null,ae=null,ke=null,yt=null;return{setTest:function(ut){D||(ut?ne(n.STENCIL_TEST):Se(n.STENCIL_TEST))},setMask:function(ut){me!==ut&&!D&&(n.stencilMask(ut),me=ut)},setFunc:function(ut,mn,Rn){(se!==ut||ye!==mn||ie!==Rn)&&(n.stencilFunc(ut,mn,Rn),se=ut,ye=mn,ie=Rn)},setOp:function(ut,mn,Rn){(Q!==ut||ae!==mn||ke!==Rn)&&(n.stencilOp(ut,mn,Rn),Q=ut,ae=mn,ke=Rn)},setLocked:function(ut){D=ut},setClear:function(ut){yt!==ut&&(n.clearStencil(ut),yt=ut)},reset:function(){D=!1,me=null,se=null,ye=null,ie=null,Q=null,ae=null,ke=null,yt=null}}}const a=new t,o=new i,c=new s,l=new WeakMap,u=new WeakMap;let d={},f={},p=new WeakMap,m=[],y=null,v=!1,_=null,h=null,w=null,T=null,A=null,I=null,P=null,U=new it(0,0,0),V=0,S=!1,b=null,L=null,q=null,H=null,J=null;const Y=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,G=0;const te=n.getParameter(n.VERSION);te.indexOf("WebGL")!==-1?(G=parseFloat(/^WebGL (\d)/.exec(te)[1]),X=G>=1):te.indexOf("OpenGL ES")!==-1&&(G=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),X=G>=2);let _e=null,he={};const ge=n.getParameter(n.SCISSOR_BOX),je=n.getParameter(n.VIEWPORT),qe=new wt().fromArray(ge),St=new wt().fromArray(je);function vt(D,me,se,ye){const ie=new Uint8Array(4),Q=n.createTexture();n.bindTexture(D,Q),n.texParameteri(D,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(D,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ae=0;ae<se;ae++)D===n.TEXTURE_3D||D===n.TEXTURE_2D_ARRAY?n.texImage3D(me,0,n.RGBA,1,1,ye,0,n.RGBA,n.UNSIGNED_BYTE,ie):n.texImage2D(me+ae,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,ie);return Q}const $={};$[n.TEXTURE_2D]=vt(n.TEXTURE_2D,n.TEXTURE_2D,1),$[n.TEXTURE_CUBE_MAP]=vt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[n.TEXTURE_2D_ARRAY]=vt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),$[n.TEXTURE_3D]=vt(n.TEXTURE_3D,n.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),c.setClear(0),ne(n.DEPTH_TEST),o.setFunc(Lr),Ke(!1),It(Hc),ne(n.CULL_FACE),lt(On);function ne(D){d[D]!==!0&&(n.enable(D),d[D]=!0)}function Se(D){d[D]!==!1&&(n.disable(D),d[D]=!1)}function ze(D,me){return f[D]!==me?(n.bindFramebuffer(D,me),f[D]=me,D===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=me),D===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=me),!0):!1}function Ee(D,me){let se=m,ye=!1;if(D){se=p.get(me),se===void 0&&(se=[],p.set(me,se));const ie=D.textures;if(se.length!==ie.length||se[0]!==n.COLOR_ATTACHMENT0){for(let Q=0,ae=ie.length;Q<ae;Q++)se[Q]=n.COLOR_ATTACHMENT0+Q;se.length=ie.length,ye=!0}}else se[0]!==n.BACK&&(se[0]=n.BACK,ye=!0);ye&&n.drawBuffers(se)}function et(D){return y!==D?(n.useProgram(D),y=D,!0):!1}const Lt={[Ai]:n.FUNC_ADD,[Zd]:n.FUNC_SUBTRACT,[Jd]:n.FUNC_REVERSE_SUBTRACT};Lt[Qd]=n.MIN,Lt[eh]=n.MAX;const Je={[th]:n.ZERO,[nh]:n.ONE,[ih]:n.SRC_COLOR,[so]:n.SRC_ALPHA,[lh]:n.SRC_ALPHA_SATURATE,[oh]:n.DST_COLOR,[sh]:n.DST_ALPHA,[rh]:n.ONE_MINUS_SRC_COLOR,[ao]:n.ONE_MINUS_SRC_ALPHA,[ch]:n.ONE_MINUS_DST_COLOR,[ah]:n.ONE_MINUS_DST_ALPHA,[uh]:n.CONSTANT_COLOR,[dh]:n.ONE_MINUS_CONSTANT_COLOR,[hh]:n.CONSTANT_ALPHA,[fh]:n.ONE_MINUS_CONSTANT_ALPHA};function lt(D,me,se,ye,ie,Q,ae,ke,yt,ut){if(D===On){v===!0&&(Se(n.BLEND),v=!1);return}if(v===!1&&(ne(n.BLEND),v=!0),D!==$d){if(D!==_||ut!==S){if((h!==Ai||A!==Ai)&&(n.blendEquation(n.FUNC_ADD),h=Ai,A=Ai),ut)switch(D){case wr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Wc:n.blendFunc(n.ONE,n.ONE);break;case qc:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Kc:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:nt("WebGLState: Invalid blending: ",D);break}else switch(D){case wr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Wc:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case qc:nt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Kc:nt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:nt("WebGLState: Invalid blending: ",D);break}w=null,T=null,I=null,P=null,U.set(0,0,0),V=0,_=D,S=ut}return}ie=ie||me,Q=Q||se,ae=ae||ye,(me!==h||ie!==A)&&(n.blendEquationSeparate(Lt[me],Lt[ie]),h=me,A=ie),(se!==w||ye!==T||Q!==I||ae!==P)&&(n.blendFuncSeparate(Je[se],Je[ye],Je[Q],Je[ae]),w=se,T=ye,I=Q,P=ae),(ke.equals(U)===!1||yt!==V)&&(n.blendColor(ke.r,ke.g,ke.b,yt),U.copy(ke),V=yt),_=D,S=!1}function mt(D,me){D.side===Nn?Se(n.CULL_FACE):ne(n.CULL_FACE);let se=D.side===Yt;me&&(se=!se),Ke(se),D.blending===wr&&D.transparent===!1?lt(On):lt(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),a.setMask(D.colorWrite);const ye=D.stencilWrite;c.setTest(ye),ye&&(c.setMask(D.stencilWriteMask),c.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),c.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),Rt(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ne(n.SAMPLE_ALPHA_TO_COVERAGE):Se(n.SAMPLE_ALPHA_TO_COVERAGE)}function Ke(D){b!==D&&(D?n.frontFace(n.CW):n.frontFace(n.CCW),b=D)}function It(D){D!==Xd?(ne(n.CULL_FACE),D!==L&&(D===Hc?n.cullFace(n.BACK):D===jd?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Se(n.CULL_FACE),L=D}function C(D){D!==q&&(X&&n.lineWidth(D),q=D)}function Rt(D,me,se){D?(ne(n.POLYGON_OFFSET_FILL),(H!==me||J!==se)&&(n.polygonOffset(me,se),H=me,J=se)):Se(n.POLYGON_OFFSET_FILL)}function ot(D){D?ne(n.SCISSOR_TEST):Se(n.SCISSOR_TEST)}function gt(D){D===void 0&&(D=n.TEXTURE0+Y-1),_e!==D&&(n.activeTexture(D),_e=D)}function Ae(D,me,se){se===void 0&&(_e===null?se=n.TEXTURE0+Y-1:se=_e);let ye=he[se];ye===void 0&&(ye={type:void 0,texture:void 0},he[se]=ye),(ye.type!==D||ye.texture!==me)&&(_e!==se&&(n.activeTexture(se),_e=se),n.bindTexture(D,me||$[D]),ye.type=D,ye.texture=me)}function M(){const D=he[_e];D!==void 0&&D.type!==void 0&&(n.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function g(){try{n.compressedTexImage2D(...arguments)}catch(D){nt("WebGLState:",D)}}function N(){try{n.compressedTexImage3D(...arguments)}catch(D){nt("WebGLState:",D)}}function j(){try{n.texSubImage2D(...arguments)}catch(D){nt("WebGLState:",D)}}function ee(){try{n.texSubImage3D(...arguments)}catch(D){nt("WebGLState:",D)}}function K(){try{n.compressedTexSubImage2D(...arguments)}catch(D){nt("WebGLState:",D)}}function Ce(){try{n.compressedTexSubImage3D(...arguments)}catch(D){nt("WebGLState:",D)}}function oe(){try{n.texStorage2D(...arguments)}catch(D){nt("WebGLState:",D)}}function Te(){try{n.texStorage3D(...arguments)}catch(D){nt("WebGLState:",D)}}function Oe(){try{n.texImage2D(...arguments)}catch(D){nt("WebGLState:",D)}}function re(){try{n.texImage3D(...arguments)}catch(D){nt("WebGLState:",D)}}function ue(D){qe.equals(D)===!1&&(n.scissor(D.x,D.y,D.z,D.w),qe.copy(D))}function we(D){St.equals(D)===!1&&(n.viewport(D.x,D.y,D.z,D.w),St.copy(D))}function Ie(D,me){let se=u.get(me);se===void 0&&(se=new WeakMap,u.set(me,se));let ye=se.get(D);ye===void 0&&(ye=n.getUniformBlockIndex(me,D.name),se.set(D,ye))}function ce(D,me){const ye=u.get(me).get(D);l.get(me)!==ye&&(n.uniformBlockBinding(me,ye,D.__bindingPointIndex),l.set(me,ye))}function Xe(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),d={},_e=null,he={},f={},p=new WeakMap,m=[],y=null,v=!1,_=null,h=null,w=null,T=null,A=null,I=null,P=null,U=new it(0,0,0),V=0,S=!1,b=null,L=null,q=null,H=null,J=null,qe.set(0,0,n.canvas.width,n.canvas.height),St.set(0,0,n.canvas.width,n.canvas.height),a.reset(),o.reset(),c.reset()}return{buffers:{color:a,depth:o,stencil:c},enable:ne,disable:Se,bindFramebuffer:ze,drawBuffers:Ee,useProgram:et,setBlending:lt,setMaterial:mt,setFlipSided:Ke,setCullFace:It,setLineWidth:C,setPolygonOffset:Rt,setScissorTest:ot,activeTexture:gt,bindTexture:Ae,unbindTexture:M,compressedTexImage2D:g,compressedTexImage3D:N,texImage2D:Oe,texImage3D:re,updateUBOMapping:Ie,uniformBlockBinding:ce,texStorage2D:oe,texStorage3D:Te,texSubImage2D:j,texSubImage3D:ee,compressedTexSubImage2D:K,compressedTexSubImage3D:Ce,scissor:ue,viewport:we,reset:Xe}}function Zg(n,e,t,i,s,a,o){const c=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),u=new at,d=new WeakMap;let f;const p=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(M,g){return m?new OffscreenCanvas(M,g):oa("canvas")}function v(M,g,N){let j=1;const ee=Ae(M);if((ee.width>N||ee.height>N)&&(j=N/Math.max(ee.width,ee.height)),j<1)if(typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&M instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&M instanceof ImageBitmap||typeof VideoFrame<"u"&&M instanceof VideoFrame){const K=Math.floor(j*ee.width),Ce=Math.floor(j*ee.height);f===void 0&&(f=y(K,Ce));const oe=g?y(K,Ce):f;return oe.width=K,oe.height=Ce,oe.getContext("2d").drawImage(M,0,0,K,Ce),Ve("WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+K+"x"+Ce+")."),oe}else return"data"in M&&Ve("WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),M;return M}function _(M){return M.generateMipmaps}function h(M){n.generateMipmap(M)}function w(M){return M.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:M.isWebGL3DRenderTarget?n.TEXTURE_3D:M.isWebGLArrayRenderTarget||M.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function T(M,g,N,j,ee=!1){if(M!==null){if(n[M]!==void 0)return n[M];Ve("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+M+"'")}let K=g;if(g===n.RED&&(N===n.FLOAT&&(K=n.R32F),N===n.HALF_FLOAT&&(K=n.R16F),N===n.UNSIGNED_BYTE&&(K=n.R8)),g===n.RED_INTEGER&&(N===n.UNSIGNED_BYTE&&(K=n.R8UI),N===n.UNSIGNED_SHORT&&(K=n.R16UI),N===n.UNSIGNED_INT&&(K=n.R32UI),N===n.BYTE&&(K=n.R8I),N===n.SHORT&&(K=n.R16I),N===n.INT&&(K=n.R32I)),g===n.RG&&(N===n.FLOAT&&(K=n.RG32F),N===n.HALF_FLOAT&&(K=n.RG16F),N===n.UNSIGNED_BYTE&&(K=n.RG8)),g===n.RG_INTEGER&&(N===n.UNSIGNED_BYTE&&(K=n.RG8UI),N===n.UNSIGNED_SHORT&&(K=n.RG16UI),N===n.UNSIGNED_INT&&(K=n.RG32UI),N===n.BYTE&&(K=n.RG8I),N===n.SHORT&&(K=n.RG16I),N===n.INT&&(K=n.RG32I)),g===n.RGB_INTEGER&&(N===n.UNSIGNED_BYTE&&(K=n.RGB8UI),N===n.UNSIGNED_SHORT&&(K=n.RGB16UI),N===n.UNSIGNED_INT&&(K=n.RGB32UI),N===n.BYTE&&(K=n.RGB8I),N===n.SHORT&&(K=n.RGB16I),N===n.INT&&(K=n.RGB32I)),g===n.RGBA_INTEGER&&(N===n.UNSIGNED_BYTE&&(K=n.RGBA8UI),N===n.UNSIGNED_SHORT&&(K=n.RGBA16UI),N===n.UNSIGNED_INT&&(K=n.RGBA32UI),N===n.BYTE&&(K=n.RGBA8I),N===n.SHORT&&(K=n.RGBA16I),N===n.INT&&(K=n.RGBA32I)),g===n.RGB&&(N===n.UNSIGNED_INT_5_9_9_9_REV&&(K=n.RGB9_E5),N===n.UNSIGNED_INT_10F_11F_11F_REV&&(K=n.R11F_G11F_B10F)),g===n.RGBA){const Ce=ee?sa:Qe.getTransfer(j);N===n.FLOAT&&(K=n.RGBA32F),N===n.HALF_FLOAT&&(K=n.RGBA16F),N===n.UNSIGNED_BYTE&&(K=Ce===ft?n.SRGB8_ALPHA8:n.RGBA8),N===n.UNSIGNED_SHORT_4_4_4_4&&(K=n.RGBA4),N===n.UNSIGNED_SHORT_5_5_5_1&&(K=n.RGB5_A1)}return(K===n.R16F||K===n.R32F||K===n.RG16F||K===n.RG32F||K===n.RGBA16F||K===n.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function A(M,g){let N;return M?g===null||g===wn||g===ls?N=n.DEPTH24_STENCIL8:g===xn?N=n.DEPTH32F_STENCIL8:g===cs&&(N=n.DEPTH24_STENCIL8,Ve("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===wn||g===ls?N=n.DEPTH_COMPONENT24:g===xn?N=n.DEPTH_COMPONENT32F:g===cs&&(N=n.DEPTH_COMPONENT16),N}function I(M,g){return _(M)===!0||M.isFramebufferTexture&&M.minFilter!==Bt&&M.minFilter!==Vt?Math.log2(Math.max(g.width,g.height))+1:M.mipmaps!==void 0&&M.mipmaps.length>0?M.mipmaps.length:M.isCompressedTexture&&Array.isArray(M.image)?g.mipmaps.length:1}function P(M){const g=M.target;g.removeEventListener("dispose",P),V(g),g.isVideoTexture&&d.delete(g)}function U(M){const g=M.target;g.removeEventListener("dispose",U),b(g)}function V(M){const g=i.get(M);if(g.__webglInit===void 0)return;const N=M.source,j=p.get(N);if(j){const ee=j[g.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&S(M),Object.keys(j).length===0&&p.delete(N)}i.remove(M)}function S(M){const g=i.get(M);n.deleteTexture(g.__webglTexture);const N=M.source,j=p.get(N);delete j[g.__cacheKey],o.memory.textures--}function b(M){const g=i.get(M);if(M.depthTexture&&(M.depthTexture.dispose(),i.remove(M.depthTexture)),M.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(g.__webglFramebuffer[j]))for(let ee=0;ee<g.__webglFramebuffer[j].length;ee++)n.deleteFramebuffer(g.__webglFramebuffer[j][ee]);else n.deleteFramebuffer(g.__webglFramebuffer[j]);g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer[j])}else{if(Array.isArray(g.__webglFramebuffer))for(let j=0;j<g.__webglFramebuffer.length;j++)n.deleteFramebuffer(g.__webglFramebuffer[j]);else n.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&n.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&n.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let j=0;j<g.__webglColorRenderbuffer.length;j++)g.__webglColorRenderbuffer[j]&&n.deleteRenderbuffer(g.__webglColorRenderbuffer[j]);g.__webglDepthRenderbuffer&&n.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const N=M.textures;for(let j=0,ee=N.length;j<ee;j++){const K=i.get(N[j]);K.__webglTexture&&(n.deleteTexture(K.__webglTexture),o.memory.textures--),i.remove(N[j])}i.remove(M)}let L=0;function q(){L=0}function H(){const M=L;return M>=s.maxTextures&&Ve("WebGLTextures: Trying to use "+M+" texture units while this GPU supports only "+s.maxTextures),L+=1,M}function J(M){const g=[];return g.push(M.wrapS),g.push(M.wrapT),g.push(M.wrapR||0),g.push(M.magFilter),g.push(M.minFilter),g.push(M.anisotropy),g.push(M.internalFormat),g.push(M.format),g.push(M.type),g.push(M.generateMipmaps),g.push(M.premultiplyAlpha),g.push(M.flipY),g.push(M.unpackAlignment),g.push(M.colorSpace),g.join()}function Y(M,g){const N=i.get(M);if(M.isVideoTexture&&ot(M),M.isRenderTargetTexture===!1&&M.isExternalTexture!==!0&&M.version>0&&N.__version!==M.version){const j=M.image;if(j===null)Ve("WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)Ve("WebGLRenderer: Texture marked for update but image is incomplete");else{$(N,M,g);return}}else M.isExternalTexture&&(N.__webglTexture=M.sourceTexture?M.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,N.__webglTexture,n.TEXTURE0+g)}function X(M,g){const N=i.get(M);if(M.isRenderTargetTexture===!1&&M.version>0&&N.__version!==M.version){$(N,M,g);return}else M.isExternalTexture&&(N.__webglTexture=M.sourceTexture?M.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,N.__webglTexture,n.TEXTURE0+g)}function G(M,g){const N=i.get(M);if(M.isRenderTargetTexture===!1&&M.version>0&&N.__version!==M.version){$(N,M,g);return}t.bindTexture(n.TEXTURE_3D,N.__webglTexture,n.TEXTURE0+g)}function te(M,g){const N=i.get(M);if(M.isCubeDepthTexture!==!0&&M.version>0&&N.__version!==M.version){ne(N,M,g);return}t.bindTexture(n.TEXTURE_CUBE_MAP,N.__webglTexture,n.TEXTURE0+g)}const _e={[go]:n.REPEAT,[Fn]:n.CLAMP_TO_EDGE,[yo]:n.MIRRORED_REPEAT},he={[Bt]:n.NEAREST,[_h]:n.NEAREST_MIPMAP_NEAREST,[Ps]:n.NEAREST_MIPMAP_LINEAR,[Vt]:n.LINEAR,[Aa]:n.LINEAR_MIPMAP_NEAREST,[Ci]:n.LINEAR_MIPMAP_LINEAR},ge={[xh]:n.NEVER,[wh]:n.ALWAYS,[vh]:n.LESS,[Mc]:n.LEQUAL,[Sh]:n.EQUAL,[wc]:n.GEQUAL,[bh]:n.GREATER,[Mh]:n.NOTEQUAL};function je(M,g){if(g.type===xn&&e.has("OES_texture_float_linear")===!1&&(g.magFilter===Vt||g.magFilter===Aa||g.magFilter===Ps||g.magFilter===Ci||g.minFilter===Vt||g.minFilter===Aa||g.minFilter===Ps||g.minFilter===Ci)&&Ve("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(M,n.TEXTURE_WRAP_S,_e[g.wrapS]),n.texParameteri(M,n.TEXTURE_WRAP_T,_e[g.wrapT]),(M===n.TEXTURE_3D||M===n.TEXTURE_2D_ARRAY)&&n.texParameteri(M,n.TEXTURE_WRAP_R,_e[g.wrapR]),n.texParameteri(M,n.TEXTURE_MAG_FILTER,he[g.magFilter]),n.texParameteri(M,n.TEXTURE_MIN_FILTER,he[g.minFilter]),g.compareFunction&&(n.texParameteri(M,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(M,n.TEXTURE_COMPARE_FUNC,ge[g.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===Bt||g.minFilter!==Ps&&g.minFilter!==Ci||g.type===xn&&e.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||i.get(g).__currentAnisotropy){const N=e.get("EXT_texture_filter_anisotropic");n.texParameterf(M,N.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),i.get(g).__currentAnisotropy=g.anisotropy}}}function qe(M,g){let N=!1;M.__webglInit===void 0&&(M.__webglInit=!0,g.addEventListener("dispose",P));const j=g.source;let ee=p.get(j);ee===void 0&&(ee={},p.set(j,ee));const K=J(g);if(K!==M.__cacheKey){ee[K]===void 0&&(ee[K]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,N=!0),ee[K].usedTimes++;const Ce=ee[M.__cacheKey];Ce!==void 0&&(ee[M.__cacheKey].usedTimes--,Ce.usedTimes===0&&S(g)),M.__cacheKey=K,M.__webglTexture=ee[K].texture}return N}function St(M,g,N){return Math.floor(Math.floor(M/N)/g)}function vt(M,g,N,j){const K=M.updateRanges;if(K.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,g.width,g.height,N,j,g.data);else{K.sort((re,ue)=>re.start-ue.start);let Ce=0;for(let re=1;re<K.length;re++){const ue=K[Ce],we=K[re],Ie=ue.start+ue.count,ce=St(we.start,g.width,4),Xe=St(ue.start,g.width,4);we.start<=Ie+1&&ce===Xe&&St(we.start+we.count-1,g.width,4)===ce?ue.count=Math.max(ue.count,we.start+we.count-ue.start):(++Ce,K[Ce]=we)}K.length=Ce+1;const oe=n.getParameter(n.UNPACK_ROW_LENGTH),Te=n.getParameter(n.UNPACK_SKIP_PIXELS),Oe=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,g.width);for(let re=0,ue=K.length;re<ue;re++){const we=K[re],Ie=Math.floor(we.start/4),ce=Math.ceil(we.count/4),Xe=Ie%g.width,D=Math.floor(Ie/g.width),me=ce,se=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,Xe),n.pixelStorei(n.UNPACK_SKIP_ROWS,D),t.texSubImage2D(n.TEXTURE_2D,0,Xe,D,me,se,N,j,g.data)}M.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,oe),n.pixelStorei(n.UNPACK_SKIP_PIXELS,Te),n.pixelStorei(n.UNPACK_SKIP_ROWS,Oe)}}function $(M,g,N){let j=n.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(j=n.TEXTURE_2D_ARRAY),g.isData3DTexture&&(j=n.TEXTURE_3D);const ee=qe(M,g),K=g.source;t.bindTexture(j,M.__webglTexture,n.TEXTURE0+N);const Ce=i.get(K);if(K.version!==Ce.__version||ee===!0){t.activeTexture(n.TEXTURE0+N);const oe=Qe.getPrimaries(Qe.workingColorSpace),Te=g.colorSpace===Zn?null:Qe.getPrimaries(g.colorSpace),Oe=g.colorSpace===Zn||oe===Te?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Oe);let re=v(g.image,!1,s.maxTextureSize);re=gt(g,re);const ue=a.convert(g.format,g.colorSpace),we=a.convert(g.type);let Ie=T(g.internalFormat,ue,we,g.colorSpace,g.isVideoTexture);je(j,g);let ce;const Xe=g.mipmaps,D=g.isVideoTexture!==!0,me=Ce.__version===void 0||ee===!0,se=K.dataReady,ye=I(g,re);if(g.isDepthTexture)Ie=A(g.format===Pi,g.type),me&&(D?t.texStorage2D(n.TEXTURE_2D,1,Ie,re.width,re.height):t.texImage2D(n.TEXTURE_2D,0,Ie,re.width,re.height,0,ue,we,null));else if(g.isDataTexture)if(Xe.length>0){D&&me&&t.texStorage2D(n.TEXTURE_2D,ye,Ie,Xe[0].width,Xe[0].height);for(let ie=0,Q=Xe.length;ie<Q;ie++)ce=Xe[ie],D?se&&t.texSubImage2D(n.TEXTURE_2D,ie,0,0,ce.width,ce.height,ue,we,ce.data):t.texImage2D(n.TEXTURE_2D,ie,Ie,ce.width,ce.height,0,ue,we,ce.data);g.generateMipmaps=!1}else D?(me&&t.texStorage2D(n.TEXTURE_2D,ye,Ie,re.width,re.height),se&&vt(g,re,ue,we)):t.texImage2D(n.TEXTURE_2D,0,Ie,re.width,re.height,0,ue,we,re.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){D&&me&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ye,Ie,Xe[0].width,Xe[0].height,re.depth);for(let ie=0,Q=Xe.length;ie<Q;ie++)if(ce=Xe[ie],g.format!==fn)if(ue!==null)if(D){if(se)if(g.layerUpdates.size>0){const ae=gl(ce.width,ce.height,g.format,g.type);for(const ke of g.layerUpdates){const yt=ce.data.subarray(ke*ae/ce.data.BYTES_PER_ELEMENT,(ke+1)*ae/ce.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ie,0,0,ke,ce.width,ce.height,1,ue,yt)}g.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ie,0,0,0,ce.width,ce.height,re.depth,ue,ce.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ie,Ie,ce.width,ce.height,re.depth,0,ce.data,0,0);else Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?se&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ie,0,0,0,ce.width,ce.height,re.depth,ue,we,ce.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ie,Ie,ce.width,ce.height,re.depth,0,ue,we,ce.data)}else{D&&me&&t.texStorage2D(n.TEXTURE_2D,ye,Ie,Xe[0].width,Xe[0].height);for(let ie=0,Q=Xe.length;ie<Q;ie++)ce=Xe[ie],g.format!==fn?ue!==null?D?se&&t.compressedTexSubImage2D(n.TEXTURE_2D,ie,0,0,ce.width,ce.height,ue,ce.data):t.compressedTexImage2D(n.TEXTURE_2D,ie,Ie,ce.width,ce.height,0,ce.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?se&&t.texSubImage2D(n.TEXTURE_2D,ie,0,0,ce.width,ce.height,ue,we,ce.data):t.texImage2D(n.TEXTURE_2D,ie,Ie,ce.width,ce.height,0,ue,we,ce.data)}else if(g.isDataArrayTexture)if(D){if(me&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ye,Ie,re.width,re.height,re.depth),se)if(g.layerUpdates.size>0){const ie=gl(re.width,re.height,g.format,g.type);for(const Q of g.layerUpdates){const ae=re.data.subarray(Q*ie/re.data.BYTES_PER_ELEMENT,(Q+1)*ie/re.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Q,re.width,re.height,1,ue,we,ae)}g.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,re.width,re.height,re.depth,ue,we,re.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ie,re.width,re.height,re.depth,0,ue,we,re.data);else if(g.isData3DTexture)D?(me&&t.texStorage3D(n.TEXTURE_3D,ye,Ie,re.width,re.height,re.depth),se&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,re.width,re.height,re.depth,ue,we,re.data)):t.texImage3D(n.TEXTURE_3D,0,Ie,re.width,re.height,re.depth,0,ue,we,re.data);else if(g.isFramebufferTexture){if(me)if(D)t.texStorage2D(n.TEXTURE_2D,ye,Ie,re.width,re.height);else{let ie=re.width,Q=re.height;for(let ae=0;ae<ye;ae++)t.texImage2D(n.TEXTURE_2D,ae,Ie,ie,Q,0,ue,we,null),ie>>=1,Q>>=1}}else if(Xe.length>0){if(D&&me){const ie=Ae(Xe[0]);t.texStorage2D(n.TEXTURE_2D,ye,Ie,ie.width,ie.height)}for(let ie=0,Q=Xe.length;ie<Q;ie++)ce=Xe[ie],D?se&&t.texSubImage2D(n.TEXTURE_2D,ie,0,0,ue,we,ce):t.texImage2D(n.TEXTURE_2D,ie,Ie,ue,we,ce);g.generateMipmaps=!1}else if(D){if(me){const ie=Ae(re);t.texStorage2D(n.TEXTURE_2D,ye,Ie,ie.width,ie.height)}se&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ue,we,re)}else t.texImage2D(n.TEXTURE_2D,0,Ie,ue,we,re);_(g)&&h(j),Ce.__version=K.version,g.onUpdate&&g.onUpdate(g)}M.__version=g.version}function ne(M,g,N){if(g.image.length!==6)return;const j=qe(M,g),ee=g.source;t.bindTexture(n.TEXTURE_CUBE_MAP,M.__webglTexture,n.TEXTURE0+N);const K=i.get(ee);if(ee.version!==K.__version||j===!0){t.activeTexture(n.TEXTURE0+N);const Ce=Qe.getPrimaries(Qe.workingColorSpace),oe=g.colorSpace===Zn?null:Qe.getPrimaries(g.colorSpace),Te=g.colorSpace===Zn||Ce===oe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,g.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,g.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Te);const Oe=g.isCompressedTexture||g.image[0].isCompressedTexture,re=g.image[0]&&g.image[0].isDataTexture,ue=[];for(let Q=0;Q<6;Q++)!Oe&&!re?ue[Q]=v(g.image[Q],!0,s.maxCubemapSize):ue[Q]=re?g.image[Q].image:g.image[Q],ue[Q]=gt(g,ue[Q]);const we=ue[0],Ie=a.convert(g.format,g.colorSpace),ce=a.convert(g.type),Xe=T(g.internalFormat,Ie,ce,g.colorSpace),D=g.isVideoTexture!==!0,me=K.__version===void 0||j===!0,se=ee.dataReady;let ye=I(g,we);je(n.TEXTURE_CUBE_MAP,g);let ie;if(Oe){D&&me&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ye,Xe,we.width,we.height);for(let Q=0;Q<6;Q++){ie=ue[Q].mipmaps;for(let ae=0;ae<ie.length;ae++){const ke=ie[ae];g.format!==fn?Ie!==null?D?se&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae,0,0,ke.width,ke.height,Ie,ke.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae,Xe,ke.width,ke.height,0,ke.data):Ve("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae,0,0,ke.width,ke.height,Ie,ce,ke.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae,Xe,ke.width,ke.height,0,Ie,ce,ke.data)}}}else{if(ie=g.mipmaps,D&&me){ie.length>0&&ye++;const Q=Ae(ue[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ye,Xe,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(re){D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,ue[Q].width,ue[Q].height,Ie,ce,ue[Q].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Xe,ue[Q].width,ue[Q].height,0,Ie,ce,ue[Q].data);for(let ae=0;ae<ie.length;ae++){const yt=ie[ae].image[Q].image;D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae+1,0,0,yt.width,yt.height,Ie,ce,yt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae+1,Xe,yt.width,yt.height,0,Ie,ce,yt.data)}}else{D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Ie,ce,ue[Q]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Xe,Ie,ce,ue[Q]);for(let ae=0;ae<ie.length;ae++){const ke=ie[ae];D?se&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae+1,0,0,Ie,ce,ke.image[Q]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Q,ae+1,Xe,Ie,ce,ke.image[Q])}}}_(g)&&h(n.TEXTURE_CUBE_MAP),K.__version=ee.version,g.onUpdate&&g.onUpdate(g)}M.__version=g.version}function Se(M,g,N,j,ee,K){const Ce=a.convert(N.format,N.colorSpace),oe=a.convert(N.type),Te=T(N.internalFormat,Ce,oe,N.colorSpace),Oe=i.get(g),re=i.get(N);if(re.__renderTarget=g,!Oe.__hasExternalTextures){const ue=Math.max(1,g.width>>K),we=Math.max(1,g.height>>K);ee===n.TEXTURE_3D||ee===n.TEXTURE_2D_ARRAY?t.texImage3D(ee,K,Te,ue,we,g.depth,0,Ce,oe,null):t.texImage2D(ee,K,Te,ue,we,0,Ce,oe,null)}t.bindFramebuffer(n.FRAMEBUFFER,M),Rt(g)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,j,ee,re.__webglTexture,0,C(g)):(ee===n.TEXTURE_2D||ee>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,j,ee,re.__webglTexture,K),t.bindFramebuffer(n.FRAMEBUFFER,null)}function ze(M,g,N){if(n.bindRenderbuffer(n.RENDERBUFFER,M),g.depthBuffer){const j=g.depthTexture,ee=j&&j.isDepthTexture?j.type:null,K=A(g.stencilBuffer,ee),Ce=g.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Rt(g)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,C(g),K,g.width,g.height):N?n.renderbufferStorageMultisample(n.RENDERBUFFER,C(g),K,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,K,g.width,g.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ce,n.RENDERBUFFER,M)}else{const j=g.textures;for(let ee=0;ee<j.length;ee++){const K=j[ee],Ce=a.convert(K.format,K.colorSpace),oe=a.convert(K.type),Te=T(K.internalFormat,Ce,oe,K.colorSpace);Rt(g)?c.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,C(g),Te,g.width,g.height):N?n.renderbufferStorageMultisample(n.RENDERBUFFER,C(g),Te,g.width,g.height):n.renderbufferStorage(n.RENDERBUFFER,Te,g.width,g.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ee(M,g,N){const j=g.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,M),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const ee=i.get(g.depthTexture);if(ee.__renderTarget=g,(!ee.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),j){if(ee.__webglInit===void 0&&(ee.__webglInit=!0,g.depthTexture.addEventListener("dispose",P)),ee.__webglTexture===void 0){ee.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,ee.__webglTexture),je(n.TEXTURE_CUBE_MAP,g.depthTexture);const Oe=a.convert(g.depthTexture.format),re=a.convert(g.depthTexture.type);let ue;g.depthTexture.format===Gn?ue=n.DEPTH_COMPONENT24:g.depthTexture.format===Pi&&(ue=n.DEPTH24_STENCIL8);for(let we=0;we<6;we++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+we,0,ue,g.width,g.height,0,Oe,re,null)}}else Y(g.depthTexture,0);const K=ee.__webglTexture,Ce=C(g),oe=j?n.TEXTURE_CUBE_MAP_POSITIVE_X+N:n.TEXTURE_2D,Te=g.depthTexture.format===Pi?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(g.depthTexture.format===Gn)Rt(g)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Te,oe,K,0,Ce):n.framebufferTexture2D(n.FRAMEBUFFER,Te,oe,K,0);else if(g.depthTexture.format===Pi)Rt(g)?c.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,Te,oe,K,0,Ce):n.framebufferTexture2D(n.FRAMEBUFFER,Te,oe,K,0);else throw new Error("Unknown depthTexture format")}function et(M){const g=i.get(M),N=M.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==M.depthTexture){const j=M.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),j){const ee=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,j.removeEventListener("dispose",ee)};j.addEventListener("dispose",ee),g.__depthDisposeCallback=ee}g.__boundDepthTexture=j}if(M.depthTexture&&!g.__autoAllocateDepthBuffer)if(N)for(let j=0;j<6;j++)Ee(g.__webglFramebuffer[j],M,j);else{const j=M.texture.mipmaps;j&&j.length>0?Ee(g.__webglFramebuffer[0],M,0):Ee(g.__webglFramebuffer,M,0)}else if(N){g.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[j]),g.__webglDepthbuffer[j]===void 0)g.__webglDepthbuffer[j]=n.createRenderbuffer(),ze(g.__webglDepthbuffer[j],M,!1);else{const ee=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,K=g.__webglDepthbuffer[j];n.bindRenderbuffer(n.RENDERBUFFER,K),n.framebufferRenderbuffer(n.FRAMEBUFFER,ee,n.RENDERBUFFER,K)}}else{const j=M.texture.mipmaps;if(j&&j.length>0?t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=n.createRenderbuffer(),ze(g.__webglDepthbuffer,M,!1);else{const ee=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,K=g.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,K),n.framebufferRenderbuffer(n.FRAMEBUFFER,ee,n.RENDERBUFFER,K)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function Lt(M,g,N){const j=i.get(M);g!==void 0&&Se(j.__webglFramebuffer,M,M.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),N!==void 0&&et(M)}function Je(M){const g=M.texture,N=i.get(M),j=i.get(g);M.addEventListener("dispose",U);const ee=M.textures,K=M.isWebGLCubeRenderTarget===!0,Ce=ee.length>1;if(Ce||(j.__webglTexture===void 0&&(j.__webglTexture=n.createTexture()),j.__version=g.version,o.memory.textures++),K){N.__webglFramebuffer=[];for(let oe=0;oe<6;oe++)if(g.mipmaps&&g.mipmaps.length>0){N.__webglFramebuffer[oe]=[];for(let Te=0;Te<g.mipmaps.length;Te++)N.__webglFramebuffer[oe][Te]=n.createFramebuffer()}else N.__webglFramebuffer[oe]=n.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){N.__webglFramebuffer=[];for(let oe=0;oe<g.mipmaps.length;oe++)N.__webglFramebuffer[oe]=n.createFramebuffer()}else N.__webglFramebuffer=n.createFramebuffer();if(Ce)for(let oe=0,Te=ee.length;oe<Te;oe++){const Oe=i.get(ee[oe]);Oe.__webglTexture===void 0&&(Oe.__webglTexture=n.createTexture(),o.memory.textures++)}if(M.samples>0&&Rt(M)===!1){N.__webglMultisampledFramebuffer=n.createFramebuffer(),N.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,N.__webglMultisampledFramebuffer);for(let oe=0;oe<ee.length;oe++){const Te=ee[oe];N.__webglColorRenderbuffer[oe]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,N.__webglColorRenderbuffer[oe]);const Oe=a.convert(Te.format,Te.colorSpace),re=a.convert(Te.type),ue=T(Te.internalFormat,Oe,re,Te.colorSpace,M.isXRRenderTarget===!0),we=C(M);n.renderbufferStorageMultisample(n.RENDERBUFFER,we,ue,M.width,M.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+oe,n.RENDERBUFFER,N.__webglColorRenderbuffer[oe])}n.bindRenderbuffer(n.RENDERBUFFER,null),M.depthBuffer&&(N.__webglDepthRenderbuffer=n.createRenderbuffer(),ze(N.__webglDepthRenderbuffer,M,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(K){t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),je(n.TEXTURE_CUBE_MAP,g);for(let oe=0;oe<6;oe++)if(g.mipmaps&&g.mipmaps.length>0)for(let Te=0;Te<g.mipmaps.length;Te++)Se(N.__webglFramebuffer[oe][Te],M,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,Te);else Se(N.__webglFramebuffer[oe],M,g,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0);_(g)&&h(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ce){for(let oe=0,Te=ee.length;oe<Te;oe++){const Oe=ee[oe],re=i.get(Oe);let ue=n.TEXTURE_2D;(M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)&&(ue=M.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ue,re.__webglTexture),je(ue,Oe),Se(N.__webglFramebuffer,M,Oe,n.COLOR_ATTACHMENT0+oe,ue,0),_(Oe)&&h(ue)}t.unbindTexture()}else{let oe=n.TEXTURE_2D;if((M.isWebGL3DRenderTarget||M.isWebGLArrayRenderTarget)&&(oe=M.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(oe,j.__webglTexture),je(oe,g),g.mipmaps&&g.mipmaps.length>0)for(let Te=0;Te<g.mipmaps.length;Te++)Se(N.__webglFramebuffer[Te],M,g,n.COLOR_ATTACHMENT0,oe,Te);else Se(N.__webglFramebuffer,M,g,n.COLOR_ATTACHMENT0,oe,0);_(g)&&h(oe),t.unbindTexture()}M.depthBuffer&&et(M)}function lt(M){const g=M.textures;for(let N=0,j=g.length;N<j;N++){const ee=g[N];if(_(ee)){const K=w(M),Ce=i.get(ee).__webglTexture;t.bindTexture(K,Ce),h(K),t.unbindTexture()}}}const mt=[],Ke=[];function It(M){if(M.samples>0){if(Rt(M)===!1){const g=M.textures,N=M.width,j=M.height;let ee=n.COLOR_BUFFER_BIT;const K=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ce=i.get(M),oe=g.length>1;if(oe)for(let Oe=0;Oe<g.length;Oe++)t.bindFramebuffer(n.FRAMEBUFFER,Ce.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Oe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ce.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Oe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ce.__webglMultisampledFramebuffer);const Te=M.texture.mipmaps;Te&&Te.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ce.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ce.__webglFramebuffer);for(let Oe=0;Oe<g.length;Oe++){if(M.resolveDepthBuffer&&(M.depthBuffer&&(ee|=n.DEPTH_BUFFER_BIT),M.stencilBuffer&&M.resolveStencilBuffer&&(ee|=n.STENCIL_BUFFER_BIT)),oe){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ce.__webglColorRenderbuffer[Oe]);const re=i.get(g[Oe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,re,0)}n.blitFramebuffer(0,0,N,j,0,0,N,j,ee,n.NEAREST),l===!0&&(mt.length=0,Ke.length=0,mt.push(n.COLOR_ATTACHMENT0+Oe),M.depthBuffer&&M.resolveDepthBuffer===!1&&(mt.push(K),Ke.push(K),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Ke)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,mt))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),oe)for(let Oe=0;Oe<g.length;Oe++){t.bindFramebuffer(n.FRAMEBUFFER,Ce.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Oe,n.RENDERBUFFER,Ce.__webglColorRenderbuffer[Oe]);const re=i.get(g[Oe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ce.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Oe,n.TEXTURE_2D,re,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ce.__webglMultisampledFramebuffer)}else if(M.depthBuffer&&M.resolveDepthBuffer===!1&&l){const g=M.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[g])}}}function C(M){return Math.min(s.maxSamples,M.samples)}function Rt(M){const g=i.get(M);return M.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function ot(M){const g=o.render.frame;d.get(M)!==g&&(d.set(M,g),M.update())}function gt(M,g){const N=M.colorSpace,j=M.format,ee=M.type;return M.isCompressedTexture===!0||M.isVideoTexture===!0||N!==Br&&N!==Zn&&(Qe.getTransfer(N)===ft?(j!==fn||ee!==en)&&Ve("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):nt("WebGLTextures: Unsupported texture color space:",N)),g}function Ae(M){return typeof HTMLImageElement<"u"&&M instanceof HTMLImageElement?(u.width=M.naturalWidth||M.width,u.height=M.naturalHeight||M.height):typeof VideoFrame<"u"&&M instanceof VideoFrame?(u.width=M.displayWidth,u.height=M.displayHeight):(u.width=M.width,u.height=M.height),u}this.allocateTextureUnit=H,this.resetTextureUnits=q,this.setTexture2D=Y,this.setTexture2DArray=X,this.setTexture3D=G,this.setTextureCube=te,this.rebindTextures=Lt,this.setupRenderTarget=Je,this.updateRenderTargetMipmap=lt,this.updateMultisampleRenderTarget=It,this.setupDepthRenderbuffer=et,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=Rt,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Jg(n,e){function t(i,s=Zn){let a;const o=Qe.getTransfer(s);if(i===en)return n.UNSIGNED_BYTE;if(i===yc)return n.UNSIGNED_SHORT_4_4_4_4;if(i===xc)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Iu)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===Ru)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Tu)return n.BYTE;if(i===Au)return n.SHORT;if(i===cs)return n.UNSIGNED_SHORT;if(i===gc)return n.INT;if(i===wn)return n.UNSIGNED_INT;if(i===xn)return n.FLOAT;if(i===zn)return n.HALF_FLOAT;if(i===Cu)return n.ALPHA;if(i===Pu)return n.RGB;if(i===fn)return n.RGBA;if(i===Gn)return n.DEPTH_COMPONENT;if(i===Pi)return n.DEPTH_STENCIL;if(i===Uu)return n.RED;if(i===vc)return n.RED_INTEGER;if(i===Fr)return n.RG;if(i===Sc)return n.RG_INTEGER;if(i===bc)return n.RGBA_INTEGER;if(i===Qs||i===ea||i===ta||i===na)if(o===ft)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Qs)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ea)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ta)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===na)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Qs)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ea)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ta)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===na)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===xo||i===vo||i===So||i===bo)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===xo)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===vo)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===So)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===bo)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Mo||i===wo||i===Eo||i===To||i===Ao||i===Io||i===Ro)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(i===Mo||i===wo)return o===ft?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===Eo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===To)return a.COMPRESSED_R11_EAC;if(i===Ao)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Io)return a.COMPRESSED_RG11_EAC;if(i===Ro)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Co||i===Po||i===Uo||i===Do||i===Lo||i===No||i===Fo||i===Bo||i===Oo||i===ko||i===Vo||i===zo||i===Go||i===Ho)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(i===Co)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Po)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Uo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Do)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Lo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===No)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Fo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Bo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Oo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ko)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Vo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===zo)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Go)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Ho)return o===ft?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Wo||i===qo||i===Ko)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(i===Wo)return o===ft?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===qo)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ko)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Xo||i===jo||i===Yo||i===$o)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(i===Xo)return a.COMPRESSED_RED_RGTC1_EXT;if(i===jo)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Yo)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===$o)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ls?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const Qg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ey=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class ty{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new qu(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new Tn({vertexShader:Qg,fragmentShader:ey,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new pn(new As(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class ny extends zr{constructor(e,t){super();const i=this;let s=null,a=1,o=null,c="local-floor",l=1,u=null,d=null,f=null,p=null,m=null,y=null;const v=typeof XRWebGLBinding<"u",_=new ty,h={},w=t.getContextAttributes();let T=null,A=null;const I=[],P=[],U=new at;let V=null;const S=new on;S.viewport=new wt;const b=new on;b.viewport=new wt;const L=[S,b],q=new hf;let H=null,J=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ne=I[$];return ne===void 0&&(ne=new $a,I[$]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function($){let ne=I[$];return ne===void 0&&(ne=new $a,I[$]=ne),ne.getGripSpace()},this.getHand=function($){let ne=I[$];return ne===void 0&&(ne=new $a,I[$]=ne),ne.getHandSpace()};function Y($){const ne=P.indexOf($.inputSource);if(ne===-1)return;const Se=I[ne];Se!==void 0&&(Se.update($.inputSource,$.frame,u||o),Se.dispatchEvent({type:$.type,data:$.inputSource}))}function X(){s.removeEventListener("select",Y),s.removeEventListener("selectstart",Y),s.removeEventListener("selectend",Y),s.removeEventListener("squeeze",Y),s.removeEventListener("squeezestart",Y),s.removeEventListener("squeezeend",Y),s.removeEventListener("end",X),s.removeEventListener("inputsourceschange",G);for(let $=0;$<I.length;$++){const ne=P[$];ne!==null&&(P[$]=null,I[$].disconnect(ne))}H=null,J=null,_.reset();for(const $ in h)delete h[$];e.setRenderTarget(T),m=null,p=null,f=null,s=null,A=null,vt.stop(),i.isPresenting=!1,e.setPixelRatio(V),e.setSize(U.width,U.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){a=$,i.isPresenting===!0&&Ve("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){c=$,i.isPresenting===!0&&Ve("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return u||o},this.setReferenceSpace=function($){u=$},this.getBaseLayer=function(){return p!==null?p:m},this.getBinding=function(){return f===null&&v&&(f=new XRWebGLBinding(s,t)),f},this.getFrame=function(){return y},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(T=e.getRenderTarget(),s.addEventListener("select",Y),s.addEventListener("selectstart",Y),s.addEventListener("selectend",Y),s.addEventListener("squeeze",Y),s.addEventListener("squeezestart",Y),s.addEventListener("squeezeend",Y),s.addEventListener("end",X),s.addEventListener("inputsourceschange",G),w.xrCompatible!==!0&&await t.makeXRCompatible(),V=e.getPixelRatio(),e.getSize(U),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let Se=null,ze=null,Ee=null;w.depth&&(Ee=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Se=w.stencil?Pi:Gn,ze=w.stencil?ls:wn);const et={colorFormat:t.RGBA8,depthFormat:Ee,scaleFactor:a};f=this.getBinding(),p=f.createProjectionLayer(et),s.updateRenderState({layers:[p]}),e.setPixelRatio(1),e.setSize(p.textureWidth,p.textureHeight,!1),A=new bn(p.textureWidth,p.textureHeight,{format:fn,type:en,depthTexture:new ds(p.textureWidth,p.textureHeight,ze,void 0,void 0,void 0,void 0,void 0,void 0,Se),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}else{const Se={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:a};m=new XRWebGLLayer(s,t,Se),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),A=new bn(m.framebufferWidth,m.framebufferHeight,{format:fn,type:en,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(l),u=null,o=await s.requestReferenceSpace(c),vt.setContext(s),vt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return _.getDepthTexture()};function G($){for(let ne=0;ne<$.removed.length;ne++){const Se=$.removed[ne],ze=P.indexOf(Se);ze>=0&&(P[ze]=null,I[ze].disconnect(Se))}for(let ne=0;ne<$.added.length;ne++){const Se=$.added[ne];let ze=P.indexOf(Se);if(ze===-1){for(let et=0;et<I.length;et++)if(et>=P.length){P.push(Se),ze=et;break}else if(P[et]===null){P[et]=Se,ze=et;break}if(ze===-1)break}const Ee=I[ze];Ee&&Ee.connect(Se)}}const te=new O,_e=new O;function he($,ne,Se){te.setFromMatrixPosition(ne.matrixWorld),_e.setFromMatrixPosition(Se.matrixWorld);const ze=te.distanceTo(_e),Ee=ne.projectionMatrix.elements,et=Se.projectionMatrix.elements,Lt=Ee[14]/(Ee[10]-1),Je=Ee[14]/(Ee[10]+1),lt=(Ee[9]+1)/Ee[5],mt=(Ee[9]-1)/Ee[5],Ke=(Ee[8]-1)/Ee[0],It=(et[8]+1)/et[0],C=Lt*Ke,Rt=Lt*It,ot=ze/(-Ke+It),gt=ot*-Ke;if(ne.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(gt),$.translateZ(ot),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Ee[10]===-1)$.projectionMatrix.copy(ne.projectionMatrix),$.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{const Ae=Lt+ot,M=Je+ot,g=C-gt,N=Rt+(ze-gt),j=lt*Je/M*Ae,ee=mt*Je/M*Ae;$.projectionMatrix.makePerspective(g,N,j,ee,Ae,M),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function ge($,ne){ne===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ne.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let ne=$.near,Se=$.far;_.texture!==null&&(_.depthNear>0&&(ne=_.depthNear),_.depthFar>0&&(Se=_.depthFar)),q.near=b.near=S.near=ne,q.far=b.far=S.far=Se,(H!==q.near||J!==q.far)&&(s.updateRenderState({depthNear:q.near,depthFar:q.far}),H=q.near,J=q.far),q.layers.mask=$.layers.mask|6,S.layers.mask=q.layers.mask&3,b.layers.mask=q.layers.mask&5;const ze=$.parent,Ee=q.cameras;ge(q,ze);for(let et=0;et<Ee.length;et++)ge(Ee[et],ze);Ee.length===2?he(q,S,b):q.projectionMatrix.copy(S.projectionMatrix),je($,q,ze)};function je($,ne,Se){Se===null?$.matrix.copy(ne.matrixWorld):($.matrix.copy(Se.matrixWorld),$.matrix.invert(),$.matrix.multiply(ne.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ne.projectionMatrix),$.projectionMatrixInverse.copy(ne.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Zo*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return q},this.getFoveation=function(){if(!(p===null&&m===null))return l},this.setFoveation=function($){l=$,p!==null&&(p.fixedFoveation=$),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=$)},this.hasDepthSensing=function(){return _.texture!==null},this.getDepthSensingMesh=function(){return _.getMesh(q)},this.getCameraTexture=function($){return h[$]};let qe=null;function St($,ne){if(d=ne.getViewerPose(u||o),y=ne,d!==null){const Se=d.views;m!==null&&(e.setRenderTargetFramebuffer(A,m.framebuffer),e.setRenderTarget(A));let ze=!1;Se.length!==q.cameras.length&&(q.cameras.length=0,ze=!0);for(let Je=0;Je<Se.length;Je++){const lt=Se[Je];let mt=null;if(m!==null)mt=m.getViewport(lt);else{const It=f.getViewSubImage(p,lt);mt=It.viewport,Je===0&&(e.setRenderTargetTextures(A,It.colorTexture,It.depthStencilTexture),e.setRenderTarget(A))}let Ke=L[Je];Ke===void 0&&(Ke=new on,Ke.layers.enable(Je),Ke.viewport=new wt,L[Je]=Ke),Ke.matrix.fromArray(lt.transform.matrix),Ke.matrix.decompose(Ke.position,Ke.quaternion,Ke.scale),Ke.projectionMatrix.fromArray(lt.projectionMatrix),Ke.projectionMatrixInverse.copy(Ke.projectionMatrix).invert(),Ke.viewport.set(mt.x,mt.y,mt.width,mt.height),Je===0&&(q.matrix.copy(Ke.matrix),q.matrix.decompose(q.position,q.quaternion,q.scale)),ze===!0&&q.cameras.push(Ke)}const Ee=s.enabledFeatures;if(Ee&&Ee.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&v){f=i.getBinding();const Je=f.getDepthInformation(Se[0]);Je&&Je.isValid&&Je.texture&&_.init(Je,s.renderState)}if(Ee&&Ee.includes("camera-access")&&v){e.state.unbindTexture(),f=i.getBinding();for(let Je=0;Je<Se.length;Je++){const lt=Se[Je].camera;if(lt){let mt=h[lt];mt||(mt=new qu,h[lt]=mt);const Ke=f.getCameraImage(lt);mt.sourceTexture=Ke}}}}for(let Se=0;Se<I.length;Se++){const ze=P[Se],Ee=I[Se];ze!==null&&Ee!==void 0&&Ee.update(ze,ne,u||o)}qe&&qe($,ne),ne.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ne}),y=null}const vt=new Xu;vt.setAnimationLoop(St),this.setAnimationLoop=function($){qe=$},this.dispose=function(){}}}const hi=new En,iy=new Et;function ry(n,e){function t(_,h){_.matrixAutoUpdate===!0&&_.updateMatrix(),h.value.copy(_.matrix)}function i(_,h){h.color.getRGB(_.fogColor.value,zu(n)),h.isFog?(_.fogNear.value=h.near,_.fogFar.value=h.far):h.isFogExp2&&(_.fogDensity.value=h.density)}function s(_,h,w,T,A){h.isMeshBasicMaterial||h.isMeshLambertMaterial?a(_,h):h.isMeshToonMaterial?(a(_,h),f(_,h)):h.isMeshPhongMaterial?(a(_,h),d(_,h)):h.isMeshStandardMaterial?(a(_,h),p(_,h),h.isMeshPhysicalMaterial&&m(_,h,A)):h.isMeshMatcapMaterial?(a(_,h),y(_,h)):h.isMeshDepthMaterial?a(_,h):h.isMeshDistanceMaterial?(a(_,h),v(_,h)):h.isMeshNormalMaterial?a(_,h):h.isLineBasicMaterial?(o(_,h),h.isLineDashedMaterial&&c(_,h)):h.isPointsMaterial?l(_,h,w,T):h.isSpriteMaterial?u(_,h):h.isShadowMaterial?(_.color.value.copy(h.color),_.opacity.value=h.opacity):h.isShaderMaterial&&(h.uniformsNeedUpdate=!1)}function a(_,h){_.opacity.value=h.opacity,h.color&&_.diffuse.value.copy(h.color),h.emissive&&_.emissive.value.copy(h.emissive).multiplyScalar(h.emissiveIntensity),h.map&&(_.map.value=h.map,t(h.map,_.mapTransform)),h.alphaMap&&(_.alphaMap.value=h.alphaMap,t(h.alphaMap,_.alphaMapTransform)),h.bumpMap&&(_.bumpMap.value=h.bumpMap,t(h.bumpMap,_.bumpMapTransform),_.bumpScale.value=h.bumpScale,h.side===Yt&&(_.bumpScale.value*=-1)),h.normalMap&&(_.normalMap.value=h.normalMap,t(h.normalMap,_.normalMapTransform),_.normalScale.value.copy(h.normalScale),h.side===Yt&&_.normalScale.value.negate()),h.displacementMap&&(_.displacementMap.value=h.displacementMap,t(h.displacementMap,_.displacementMapTransform),_.displacementScale.value=h.displacementScale,_.displacementBias.value=h.displacementBias),h.emissiveMap&&(_.emissiveMap.value=h.emissiveMap,t(h.emissiveMap,_.emissiveMapTransform)),h.specularMap&&(_.specularMap.value=h.specularMap,t(h.specularMap,_.specularMapTransform)),h.alphaTest>0&&(_.alphaTest.value=h.alphaTest);const w=e.get(h),T=w.envMap,A=w.envMapRotation;T&&(_.envMap.value=T,hi.copy(A),hi.x*=-1,hi.y*=-1,hi.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(hi.y*=-1,hi.z*=-1),_.envMapRotation.value.setFromMatrix4(iy.makeRotationFromEuler(hi)),_.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,_.reflectivity.value=h.reflectivity,_.ior.value=h.ior,_.refractionRatio.value=h.refractionRatio),h.lightMap&&(_.lightMap.value=h.lightMap,_.lightMapIntensity.value=h.lightMapIntensity,t(h.lightMap,_.lightMapTransform)),h.aoMap&&(_.aoMap.value=h.aoMap,_.aoMapIntensity.value=h.aoMapIntensity,t(h.aoMap,_.aoMapTransform))}function o(_,h){_.diffuse.value.copy(h.color),_.opacity.value=h.opacity,h.map&&(_.map.value=h.map,t(h.map,_.mapTransform))}function c(_,h){_.dashSize.value=h.dashSize,_.totalSize.value=h.dashSize+h.gapSize,_.scale.value=h.scale}function l(_,h,w,T){_.diffuse.value.copy(h.color),_.opacity.value=h.opacity,_.size.value=h.size*w,_.scale.value=T*.5,h.map&&(_.map.value=h.map,t(h.map,_.uvTransform)),h.alphaMap&&(_.alphaMap.value=h.alphaMap,t(h.alphaMap,_.alphaMapTransform)),h.alphaTest>0&&(_.alphaTest.value=h.alphaTest)}function u(_,h){_.diffuse.value.copy(h.color),_.opacity.value=h.opacity,_.rotation.value=h.rotation,h.map&&(_.map.value=h.map,t(h.map,_.mapTransform)),h.alphaMap&&(_.alphaMap.value=h.alphaMap,t(h.alphaMap,_.alphaMapTransform)),h.alphaTest>0&&(_.alphaTest.value=h.alphaTest)}function d(_,h){_.specular.value.copy(h.specular),_.shininess.value=Math.max(h.shininess,1e-4)}function f(_,h){h.gradientMap&&(_.gradientMap.value=h.gradientMap)}function p(_,h){_.metalness.value=h.metalness,h.metalnessMap&&(_.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,_.metalnessMapTransform)),_.roughness.value=h.roughness,h.roughnessMap&&(_.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,_.roughnessMapTransform)),h.envMap&&(_.envMapIntensity.value=h.envMapIntensity)}function m(_,h,w){_.ior.value=h.ior,h.sheen>0&&(_.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),_.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(_.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,_.sheenColorMapTransform)),h.sheenRoughnessMap&&(_.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,_.sheenRoughnessMapTransform))),h.clearcoat>0&&(_.clearcoat.value=h.clearcoat,_.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(_.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,_.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(_.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,_.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(_.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,_.clearcoatNormalMapTransform),_.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Yt&&_.clearcoatNormalScale.value.negate())),h.dispersion>0&&(_.dispersion.value=h.dispersion),h.iridescence>0&&(_.iridescence.value=h.iridescence,_.iridescenceIOR.value=h.iridescenceIOR,_.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],_.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(_.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,_.iridescenceMapTransform)),h.iridescenceThicknessMap&&(_.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,_.iridescenceThicknessMapTransform))),h.transmission>0&&(_.transmission.value=h.transmission,_.transmissionSamplerMap.value=w.texture,_.transmissionSamplerSize.value.set(w.width,w.height),h.transmissionMap&&(_.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,_.transmissionMapTransform)),_.thickness.value=h.thickness,h.thicknessMap&&(_.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,_.thicknessMapTransform)),_.attenuationDistance.value=h.attenuationDistance,_.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(_.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(_.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,_.anisotropyMapTransform))),_.specularIntensity.value=h.specularIntensity,_.specularColor.value.copy(h.specularColor),h.specularColorMap&&(_.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,_.specularColorMapTransform)),h.specularIntensityMap&&(_.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,_.specularIntensityMapTransform))}function y(_,h){h.matcap&&(_.matcap.value=h.matcap)}function v(_,h){const w=e.get(h).light;_.referencePosition.value.setFromMatrixPosition(w.matrixWorld),_.nearDistance.value=w.shadow.camera.near,_.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function sy(n,e,t,i){let s={},a={},o=[];const c=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(w,T){const A=T.program;i.uniformBlockBinding(w,A)}function u(w,T){let A=s[w.id];A===void 0&&(y(w),A=d(w),s[w.id]=A,w.addEventListener("dispose",_));const I=T.program;i.updateUBOMapping(w,I);const P=e.render.frame;a[w.id]!==P&&(p(w),a[w.id]=P)}function d(w){const T=f();w.__bindingPointIndex=T;const A=n.createBuffer(),I=w.__size,P=w.usage;return n.bindBuffer(n.UNIFORM_BUFFER,A),n.bufferData(n.UNIFORM_BUFFER,I,P),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,T,A),A}function f(){for(let w=0;w<c;w++)if(o.indexOf(w)===-1)return o.push(w),w;return nt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function p(w){const T=s[w.id],A=w.uniforms,I=w.__cache;n.bindBuffer(n.UNIFORM_BUFFER,T);for(let P=0,U=A.length;P<U;P++){const V=Array.isArray(A[P])?A[P]:[A[P]];for(let S=0,b=V.length;S<b;S++){const L=V[S];if(m(L,P,S,I)===!0){const q=L.__offset,H=Array.isArray(L.value)?L.value:[L.value];let J=0;for(let Y=0;Y<H.length;Y++){const X=H[Y],G=v(X);typeof X=="number"||typeof X=="boolean"?(L.__data[0]=X,n.bufferSubData(n.UNIFORM_BUFFER,q+J,L.__data)):X.isMatrix3?(L.__data[0]=X.elements[0],L.__data[1]=X.elements[1],L.__data[2]=X.elements[2],L.__data[3]=0,L.__data[4]=X.elements[3],L.__data[5]=X.elements[4],L.__data[6]=X.elements[5],L.__data[7]=0,L.__data[8]=X.elements[6],L.__data[9]=X.elements[7],L.__data[10]=X.elements[8],L.__data[11]=0):(X.toArray(L.__data,J),J+=G.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,q,L.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function m(w,T,A,I){const P=w.value,U=T+"_"+A;if(I[U]===void 0)return typeof P=="number"||typeof P=="boolean"?I[U]=P:I[U]=P.clone(),!0;{const V=I[U];if(typeof P=="number"||typeof P=="boolean"){if(V!==P)return I[U]=P,!0}else if(V.equals(P)===!1)return V.copy(P),!0}return!1}function y(w){const T=w.uniforms;let A=0;const I=16;for(let U=0,V=T.length;U<V;U++){const S=Array.isArray(T[U])?T[U]:[T[U]];for(let b=0,L=S.length;b<L;b++){const q=S[b],H=Array.isArray(q.value)?q.value:[q.value];for(let J=0,Y=H.length;J<Y;J++){const X=H[J],G=v(X),te=A%I,_e=te%G.boundary,he=te+_e;A+=_e,he!==0&&I-he<G.storage&&(A+=I-he),q.__data=new Float32Array(G.storage/Float32Array.BYTES_PER_ELEMENT),q.__offset=A,A+=G.storage}}}const P=A%I;return P>0&&(A+=I-P),w.__size=A,w.__cache={},this}function v(w){const T={boundary:0,storage:0};return typeof w=="number"||typeof w=="boolean"?(T.boundary=4,T.storage=4):w.isVector2?(T.boundary=8,T.storage=8):w.isVector3||w.isColor?(T.boundary=16,T.storage=12):w.isVector4?(T.boundary=16,T.storage=16):w.isMatrix3?(T.boundary=48,T.storage=48):w.isMatrix4?(T.boundary=64,T.storage=64):w.isTexture?Ve("WebGLRenderer: Texture samplers can not be part of an uniforms group."):Ve("WebGLRenderer: Unsupported uniform value type.",w),T}function _(w){const T=w.target;T.removeEventListener("dispose",_);const A=o.indexOf(T.__bindingPointIndex);o.splice(A,1),n.deleteBuffer(s[T.id]),delete s[T.id],delete a[T.id]}function h(){for(const w in s)n.deleteBuffer(s[w]);o=[],s={},a={}}return{bind:l,update:u,dispose:h}}const ay=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let _n=null;function oy(){return _n===null&&(_n=new Qh(ay,16,16,Fr,zn),_n.name="DFG_LUT",_n.minFilter=Vt,_n.magFilter=Vt,_n.wrapS=Fn,_n.wrapT=Fn,_n.generateMipmaps=!1,_n.needsUpdate=!0),_n}class cy{constructor(e={}){const{canvas:t=Eh(),context:i=null,depth:s=!0,stencil:a=!1,alpha:o=!1,antialias:c=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:u=!1,powerPreference:d="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:p=!1,outputBufferType:m=en}=e;this.isWebGLRenderer=!0;let y;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");y=i.getContextAttributes().alpha}else y=o;const v=m,_=new Set([bc,Sc,vc]),h=new Set([en,wn,cs,ls,yc,xc]),w=new Uint32Array(4),T=new Int32Array(4);let A=null,I=null;const P=[],U=[];let V=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Sn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const S=this;let b=!1;this._outputColorSpace=an;let L=0,q=0,H=null,J=-1,Y=null;const X=new wt,G=new wt;let te=null;const _e=new it(0);let he=0,ge=t.width,je=t.height,qe=1,St=null,vt=null;const $=new wt(0,0,ge,je),ne=new wt(0,0,ge,je);let Se=!1;const ze=new Ac;let Ee=!1,et=!1;const Lt=new Et,Je=new O,lt=new wt,mt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ke=!1;function It(){return H===null?qe:1}let C=i;function Rt(x,F){return t.getContext(x,F)}try{const x={alpha:!0,depth:s,stencil:a,antialias:c,premultipliedAlpha:l,preserveDrawingBuffer:u,powerPreference:d,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${_c}`),t.addEventListener("webglcontextlost",ke,!1),t.addEventListener("webglcontextrestored",yt,!1),t.addEventListener("webglcontextcreationerror",ut,!1),C===null){const F="webgl2";if(C=Rt(F,x),C===null)throw Rt(F)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(x){throw nt("WebGLRenderer: "+x.message),x}let ot,gt,Ae,M,g,N,j,ee,K,Ce,oe,Te,Oe,re,ue,we,Ie,ce,Xe,D,me,se,ye,ie;function Q(){ot=new o_(C),ot.init(),se=new Jg(C,ot),gt=new Jm(C,ot,e,se),Ae=new $g(C,ot),gt.reversedDepthBuffer&&p&&Ae.buffers.depth.setReversed(!0),M=new u_(C),g=new Ng,N=new Zg(C,ot,Ae,g,gt,se,M),j=new e_(S),ee=new a_(S),K=new pf(C),ye=new $m(C,K),Ce=new c_(C,K,M,ye),oe=new h_(C,Ce,K,M),Xe=new d_(C,gt,N),we=new Qm(g),Te=new Lg(S,j,ee,ot,gt,ye,we),Oe=new ry(S,g),re=new Bg,ue=new Hg(ot),ce=new Ym(S,j,ee,Ae,oe,y,l),Ie=new jg(S,oe,gt),ie=new sy(C,M,gt,Ae),D=new Zm(C,ot,M),me=new l_(C,ot,M),M.programs=Te.programs,S.capabilities=gt,S.extensions=ot,S.properties=g,S.renderLists=re,S.shadowMap=Ie,S.state=Ae,S.info=M}Q(),v!==en&&(V=new p_(v,t.width,t.height,s,a));const ae=new ny(S,C);this.xr=ae,this.getContext=function(){return C},this.getContextAttributes=function(){return C.getContextAttributes()},this.forceContextLoss=function(){const x=ot.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){const x=ot.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return qe},this.setPixelRatio=function(x){x!==void 0&&(qe=x,this.setSize(ge,je,!1))},this.getSize=function(x){return x.set(ge,je)},this.setSize=function(x,F,z=!0){if(ae.isPresenting){Ve("WebGLRenderer: Can't change size while VR device is presenting.");return}ge=x,je=F,t.width=Math.floor(x*qe),t.height=Math.floor(F*qe),z===!0&&(t.style.width=x+"px",t.style.height=F+"px"),V!==null&&V.setSize(t.width,t.height),this.setViewport(0,0,x,F)},this.getDrawingBufferSize=function(x){return x.set(ge*qe,je*qe).floor()},this.setDrawingBufferSize=function(x,F,z){ge=x,je=F,qe=z,t.width=Math.floor(x*z),t.height=Math.floor(F*z),this.setViewport(0,0,x,F)},this.setEffects=function(x){if(v===en){console.error("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(x){for(let F=0;F<x.length;F++)if(x[F].isOutputPass===!0){console.warn("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}V.setEffects(x||[])},this.getCurrentViewport=function(x){return x.copy(X)},this.getViewport=function(x){return x.copy($)},this.setViewport=function(x,F,z,k){x.isVector4?$.set(x.x,x.y,x.z,x.w):$.set(x,F,z,k),Ae.viewport(X.copy($).multiplyScalar(qe).round())},this.getScissor=function(x){return x.copy(ne)},this.setScissor=function(x,F,z,k){x.isVector4?ne.set(x.x,x.y,x.z,x.w):ne.set(x,F,z,k),Ae.scissor(G.copy(ne).multiplyScalar(qe).round())},this.getScissorTest=function(){return Se},this.setScissorTest=function(x){Ae.setScissorTest(Se=x)},this.setOpaqueSort=function(x){St=x},this.setTransparentSort=function(x){vt=x},this.getClearColor=function(x){return x.copy(ce.getClearColor())},this.setClearColor=function(){ce.setClearColor(...arguments)},this.getClearAlpha=function(){return ce.getClearAlpha()},this.setClearAlpha=function(){ce.setClearAlpha(...arguments)},this.clear=function(x=!0,F=!0,z=!0){let k=0;if(x){let B=!1;if(H!==null){const de=H.texture.format;B=_.has(de)}if(B){const de=H.texture.type,ve=h.has(de),pe=ce.getClearColor(),be=ce.getClearAlpha(),Pe=pe.r,Fe=pe.g,Ue=pe.b;ve?(w[0]=Pe,w[1]=Fe,w[2]=Ue,w[3]=be,C.clearBufferuiv(C.COLOR,0,w)):(T[0]=Pe,T[1]=Fe,T[2]=Ue,T[3]=be,C.clearBufferiv(C.COLOR,0,T))}else k|=C.COLOR_BUFFER_BIT}F&&(k|=C.DEPTH_BUFFER_BIT),z&&(k|=C.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),C.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ke,!1),t.removeEventListener("webglcontextrestored",yt,!1),t.removeEventListener("webglcontextcreationerror",ut,!1),ce.dispose(),re.dispose(),ue.dispose(),g.dispose(),j.dispose(),ee.dispose(),oe.dispose(),ye.dispose(),ie.dispose(),Te.dispose(),ae.dispose(),ae.removeEventListener("sessionstart",Dc),ae.removeEventListener("sessionend",Lc),si.stop()};function ke(x){x.preventDefault(),Zc("WebGLRenderer: Context Lost."),b=!0}function yt(){Zc("WebGLRenderer: Context Restored."),b=!1;const x=M.autoReset,F=Ie.enabled,z=Ie.autoUpdate,k=Ie.needsUpdate,B=Ie.type;Q(),M.autoReset=x,Ie.enabled=F,Ie.autoUpdate=z,Ie.needsUpdate=k,Ie.type=B}function ut(x){nt("WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function mn(x){const F=x.target;F.removeEventListener("dispose",mn),Rn(F)}function Rn(x){Dd(x),g.remove(x)}function Dd(x){const F=g.get(x).programs;F!==void 0&&(F.forEach(function(z){Te.releaseProgram(z)}),x.isShaderMaterial&&Te.releaseShaderCache(x))}this.renderBufferDirect=function(x,F,z,k,B,de){F===null&&(F=mt);const ve=B.isMesh&&B.matrixWorld.determinant()<0,pe=Nd(x,F,z,k,B);Ae.setMaterial(k,ve);let be=z.index,Pe=1;if(k.wireframe===!0){if(be=Ce.getWireframeAttribute(z),be===void 0)return;Pe=2}const Fe=z.drawRange,Ue=z.attributes.position;let Ye=Fe.start*Pe,pt=(Fe.start+Fe.count)*Pe;de!==null&&(Ye=Math.max(Ye,de.start*Pe),pt=Math.min(pt,(de.start+de.count)*Pe)),be!==null?(Ye=Math.max(Ye,0),pt=Math.min(pt,be.count)):Ue!=null&&(Ye=Math.max(Ye,0),pt=Math.min(pt,Ue.count));const bt=pt-Ye;if(bt<0||bt===1/0)return;ye.setup(B,k,pe,z,be);let Mt,_t=D;if(be!==null&&(Mt=K.get(be),_t=me,_t.setIndex(Mt)),B.isMesh)k.wireframe===!0?(Ae.setLineWidth(k.wireframeLinewidth*It()),_t.setMode(C.LINES)):_t.setMode(C.TRIANGLES);else if(B.isLine){let De=k.linewidth;De===void 0&&(De=1),Ae.setLineWidth(De*It()),B.isLineSegments?_t.setMode(C.LINES):B.isLineLoop?_t.setMode(C.LINE_LOOP):_t.setMode(C.LINE_STRIP)}else B.isPoints?_t.setMode(C.POINTS):B.isSprite&&_t.setMode(C.TRIANGLES);if(B.isBatchedMesh)if(B._multiDrawInstances!==null)us("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),_t.renderMultiDrawInstances(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount,B._multiDrawInstances);else if(ot.get("WEBGL_multi_draw"))_t.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{const De=B._multiDrawStarts,dt=B._multiDrawCounts,tt=B._multiDrawCount,$t=be?K.get(be).bytesPerElement:1,ki=g.get(k).currentProgram.getUniforms();for(let Zt=0;Zt<tt;Zt++)ki.setValue(C,"_gl_DrawID",Zt),_t.render(De[Zt]/$t,dt[Zt])}else if(B.isInstancedMesh)_t.renderInstances(Ye,bt,B.count);else if(z.isInstancedBufferGeometry){const De=z._maxInstanceCount!==void 0?z._maxInstanceCount:1/0,dt=Math.min(z.instanceCount,De);_t.renderInstances(Ye,bt,dt)}else _t.render(Ye,bt)};function Uc(x,F,z){x.transparent===!0&&x.side===Nn&&x.forceSinglePass===!1?(x.side=Yt,x.needsUpdate=!0,Cs(x,F,z),x.side=ii,x.needsUpdate=!0,Cs(x,F,z),x.side=Nn):Cs(x,F,z)}this.compile=function(x,F,z=null){z===null&&(z=x),I=ue.get(z),I.init(F),U.push(I),z.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(I.pushLight(B),B.castShadow&&I.pushShadow(B))}),x!==z&&x.traverseVisible(function(B){B.isLight&&B.layers.test(F.layers)&&(I.pushLight(B),B.castShadow&&I.pushShadow(B))}),I.setupLights();const k=new Set;return x.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;const de=B.material;if(de)if(Array.isArray(de))for(let ve=0;ve<de.length;ve++){const pe=de[ve];Uc(pe,z,B),k.add(pe)}else Uc(de,z,B),k.add(de)}),I=U.pop(),k},this.compileAsync=function(x,F,z=null){const k=this.compile(x,F,z);return new Promise(B=>{function de(){if(k.forEach(function(ve){g.get(ve).currentProgram.isReady()&&k.delete(ve)}),k.size===0){B(x);return}setTimeout(de,10)}ot.get("KHR_parallel_shader_compile")!==null?de():setTimeout(de,10)})};let Ma=null;function Ld(x){Ma&&Ma(x)}function Dc(){si.stop()}function Lc(){si.start()}const si=new Xu;si.setAnimationLoop(Ld),typeof self<"u"&&si.setContext(self),this.setAnimationLoop=function(x){Ma=x,ae.setAnimationLoop(x),x===null?si.stop():si.start()},ae.addEventListener("sessionstart",Dc),ae.addEventListener("sessionend",Lc),this.render=function(x,F){if(F!==void 0&&F.isCamera!==!0){nt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;const z=ae.enabled===!0&&ae.isPresenting===!0,k=V!==null&&(H===null||z)&&V.begin(S,H);if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),ae.enabled===!0&&ae.isPresenting===!0&&(V===null||V.isCompositing()===!1)&&(ae.cameraAutoUpdate===!0&&ae.updateCamera(F),F=ae.getCamera()),x.isScene===!0&&x.onBeforeRender(S,x,F,H),I=ue.get(x,U.length),I.init(F),U.push(I),Lt.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),ze.setFromProjectionMatrix(Lt,vn,F.reversedDepth),et=this.localClippingEnabled,Ee=we.init(this.clippingPlanes,et),A=re.get(x,P.length),A.init(),P.push(A),ae.enabled===!0&&ae.isPresenting===!0){const ve=S.xr.getDepthSensingMesh();ve!==null&&wa(ve,F,-1/0,S.sortObjects)}wa(x,F,0,S.sortObjects),A.finish(),S.sortObjects===!0&&A.sort(St,vt),Ke=ae.enabled===!1||ae.isPresenting===!1||ae.hasDepthSensing()===!1,Ke&&ce.addToRenderList(A,x),this.info.render.frame++,Ee===!0&&we.beginShadows();const B=I.state.shadowsArray;if(Ie.render(B,x,F),Ee===!0&&we.endShadows(),this.info.autoReset===!0&&this.info.reset(),(k&&V.hasRenderPass())===!1){const ve=A.opaque,pe=A.transmissive;if(I.setupLights(),F.isArrayCamera){const be=F.cameras;if(pe.length>0)for(let Pe=0,Fe=be.length;Pe<Fe;Pe++){const Ue=be[Pe];Fc(ve,pe,x,Ue)}Ke&&ce.render(x);for(let Pe=0,Fe=be.length;Pe<Fe;Pe++){const Ue=be[Pe];Nc(A,x,Ue,Ue.viewport)}}else pe.length>0&&Fc(ve,pe,x,F),Ke&&ce.render(x),Nc(A,x,F)}H!==null&&q===0&&(N.updateMultisampleRenderTarget(H),N.updateRenderTargetMipmap(H)),k&&V.end(S),x.isScene===!0&&x.onAfterRender(S,x,F),ye.resetDefaultState(),J=-1,Y=null,U.pop(),U.length>0?(I=U[U.length-1],Ee===!0&&we.setGlobalState(S.clippingPlanes,I.state.camera)):I=null,P.pop(),P.length>0?A=P[P.length-1]:A=null};function wa(x,F,z,k){if(x.visible===!1)return;if(x.layers.test(F.layers)){if(x.isGroup)z=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(F);else if(x.isLight)I.pushLight(x),x.castShadow&&I.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||ze.intersectsSprite(x)){k&&lt.setFromMatrixPosition(x.matrixWorld).applyMatrix4(Lt);const ve=oe.update(x),pe=x.material;pe.visible&&A.push(x,ve,pe,z,lt.z,null)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||ze.intersectsObject(x))){const ve=oe.update(x),pe=x.material;if(k&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),lt.copy(x.boundingSphere.center)):(ve.boundingSphere===null&&ve.computeBoundingSphere(),lt.copy(ve.boundingSphere.center)),lt.applyMatrix4(x.matrixWorld).applyMatrix4(Lt)),Array.isArray(pe)){const be=ve.groups;for(let Pe=0,Fe=be.length;Pe<Fe;Pe++){const Ue=be[Pe],Ye=pe[Ue.materialIndex];Ye&&Ye.visible&&A.push(x,ve,Ye,z,lt.z,Ue)}}else pe.visible&&A.push(x,ve,pe,z,lt.z,null)}}const de=x.children;for(let ve=0,pe=de.length;ve<pe;ve++)wa(de[ve],F,z,k)}function Nc(x,F,z,k){const{opaque:B,transmissive:de,transparent:ve}=x;I.setupLightsView(z),Ee===!0&&we.setGlobalState(S.clippingPlanes,z),k&&Ae.viewport(X.copy(k)),B.length>0&&Rs(B,F,z),de.length>0&&Rs(de,F,z),ve.length>0&&Rs(ve,F,z),Ae.buffers.depth.setTest(!0),Ae.buffers.depth.setMask(!0),Ae.buffers.color.setMask(!0),Ae.setPolygonOffset(!1)}function Fc(x,F,z,k){if((z.isScene===!0?z.overrideMaterial:null)!==null)return;if(I.state.transmissionRenderTarget[k.id]===void 0){const Ye=ot.has("EXT_color_buffer_half_float")||ot.has("EXT_color_buffer_float");I.state.transmissionRenderTarget[k.id]=new bn(1,1,{generateMipmaps:!0,type:Ye?zn:en,minFilter:Ci,samples:gt.samples,stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qe.workingColorSpace})}const de=I.state.transmissionRenderTarget[k.id],ve=k.viewport||X;de.setSize(ve.z*S.transmissionResolutionScale,ve.w*S.transmissionResolutionScale);const pe=S.getRenderTarget(),be=S.getActiveCubeFace(),Pe=S.getActiveMipmapLevel();S.setRenderTarget(de),S.getClearColor(_e),he=S.getClearAlpha(),he<1&&S.setClearColor(16777215,.5),S.clear(),Ke&&ce.render(z);const Fe=S.toneMapping;S.toneMapping=Sn;const Ue=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),I.setupLightsView(k),Ee===!0&&we.setGlobalState(S.clippingPlanes,k),Rs(x,z,k),N.updateMultisampleRenderTarget(de),N.updateRenderTargetMipmap(de),ot.has("WEBGL_multisampled_render_to_texture")===!1){let Ye=!1;for(let pt=0,bt=F.length;pt<bt;pt++){const Mt=F[pt],{object:_t,geometry:De,material:dt,group:tt}=Mt;if(dt.side===Nn&&_t.layers.test(k.layers)){const $t=dt.side;dt.side=Yt,dt.needsUpdate=!0,Bc(_t,z,k,De,dt,tt),dt.side=$t,dt.needsUpdate=!0,Ye=!0}}Ye===!0&&(N.updateMultisampleRenderTarget(de),N.updateRenderTargetMipmap(de))}S.setRenderTarget(pe,be,Pe),S.setClearColor(_e,he),Ue!==void 0&&(k.viewport=Ue),S.toneMapping=Fe}function Rs(x,F,z){const k=F.isScene===!0?F.overrideMaterial:null;for(let B=0,de=x.length;B<de;B++){const ve=x[B],{object:pe,geometry:be,group:Pe}=ve;let Fe=ve.material;Fe.allowOverride===!0&&k!==null&&(Fe=k),pe.layers.test(z.layers)&&Bc(pe,F,z,be,Fe,Pe)}}function Bc(x,F,z,k,B,de){x.onBeforeRender(S,F,z,k,B,de),x.modelViewMatrix.multiplyMatrices(z.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),B.onBeforeRender(S,F,z,k,x,de),B.transparent===!0&&B.side===Nn&&B.forceSinglePass===!1?(B.side=Yt,B.needsUpdate=!0,S.renderBufferDirect(z,F,k,B,x,de),B.side=ii,B.needsUpdate=!0,S.renderBufferDirect(z,F,k,B,x,de),B.side=Nn):S.renderBufferDirect(z,F,k,B,x,de),x.onAfterRender(S,F,z,k,B,de)}function Cs(x,F,z){F.isScene!==!0&&(F=mt);const k=g.get(x),B=I.state.lights,de=I.state.shadowsArray,ve=B.state.version,pe=Te.getParameters(x,B.state,de,F,z),be=Te.getProgramCacheKey(pe);let Pe=k.programs;k.environment=x.isMeshStandardMaterial?F.environment:null,k.fog=F.fog,k.envMap=(x.isMeshStandardMaterial?ee:j).get(x.envMap||k.environment),k.envMapRotation=k.environment!==null&&x.envMap===null?F.environmentRotation:x.envMapRotation,Pe===void 0&&(x.addEventListener("dispose",mn),Pe=new Map,k.programs=Pe);let Fe=Pe.get(be);if(Fe!==void 0){if(k.currentProgram===Fe&&k.lightsStateVersion===ve)return kc(x,pe),Fe}else pe.uniforms=Te.getUniforms(x),x.onBeforeCompile(pe,S),Fe=Te.acquireProgram(pe,be),Pe.set(be,Fe),k.uniforms=pe.uniforms;const Ue=k.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(Ue.clippingPlanes=we.uniform),kc(x,pe),k.needsLights=Bd(x),k.lightsStateVersion=ve,k.needsLights&&(Ue.ambientLightColor.value=B.state.ambient,Ue.lightProbe.value=B.state.probe,Ue.directionalLights.value=B.state.directional,Ue.directionalLightShadows.value=B.state.directionalShadow,Ue.spotLights.value=B.state.spot,Ue.spotLightShadows.value=B.state.spotShadow,Ue.rectAreaLights.value=B.state.rectArea,Ue.ltc_1.value=B.state.rectAreaLTC1,Ue.ltc_2.value=B.state.rectAreaLTC2,Ue.pointLights.value=B.state.point,Ue.pointLightShadows.value=B.state.pointShadow,Ue.hemisphereLights.value=B.state.hemi,Ue.directionalShadowMap.value=B.state.directionalShadowMap,Ue.directionalShadowMatrix.value=B.state.directionalShadowMatrix,Ue.spotShadowMap.value=B.state.spotShadowMap,Ue.spotLightMatrix.value=B.state.spotLightMatrix,Ue.spotLightMap.value=B.state.spotLightMap,Ue.pointShadowMap.value=B.state.pointShadowMap,Ue.pointShadowMatrix.value=B.state.pointShadowMatrix),k.currentProgram=Fe,k.uniformsList=null,Fe}function Oc(x){if(x.uniformsList===null){const F=x.currentProgram.getUniforms();x.uniformsList=ia.seqWithValue(F.seq,x.uniforms)}return x.uniformsList}function kc(x,F){const z=g.get(x);z.outputColorSpace=F.outputColorSpace,z.batching=F.batching,z.batchingColor=F.batchingColor,z.instancing=F.instancing,z.instancingColor=F.instancingColor,z.instancingMorph=F.instancingMorph,z.skinning=F.skinning,z.morphTargets=F.morphTargets,z.morphNormals=F.morphNormals,z.morphColors=F.morphColors,z.morphTargetsCount=F.morphTargetsCount,z.numClippingPlanes=F.numClippingPlanes,z.numIntersection=F.numClipIntersection,z.vertexAlphas=F.vertexAlphas,z.vertexTangents=F.vertexTangents,z.toneMapping=F.toneMapping}function Nd(x,F,z,k,B){F.isScene!==!0&&(F=mt),N.resetTextureUnits();const de=F.fog,ve=k.isMeshStandardMaterial?F.environment:null,pe=H===null?S.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:Br,be=(k.isMeshStandardMaterial?ee:j).get(k.envMap||ve),Pe=k.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,Fe=!!z.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Ue=!!z.morphAttributes.position,Ye=!!z.morphAttributes.normal,pt=!!z.morphAttributes.color;let bt=Sn;k.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&(bt=S.toneMapping);const Mt=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,_t=Mt!==void 0?Mt.length:0,De=g.get(k),dt=I.state.lights;if(Ee===!0&&(et===!0||x!==Y)){const Gt=x===Y&&k.id===J;we.setState(k,x,Gt)}let tt=!1;k.version===De.__version?(De.needsLights&&De.lightsStateVersion!==dt.state.version||De.outputColorSpace!==pe||B.isBatchedMesh&&De.batching===!1||!B.isBatchedMesh&&De.batching===!0||B.isBatchedMesh&&De.batchingColor===!0&&B.colorTexture===null||B.isBatchedMesh&&De.batchingColor===!1&&B.colorTexture!==null||B.isInstancedMesh&&De.instancing===!1||!B.isInstancedMesh&&De.instancing===!0||B.isSkinnedMesh&&De.skinning===!1||!B.isSkinnedMesh&&De.skinning===!0||B.isInstancedMesh&&De.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&De.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&De.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&De.instancingMorph===!1&&B.morphTexture!==null||De.envMap!==be||k.fog===!0&&De.fog!==de||De.numClippingPlanes!==void 0&&(De.numClippingPlanes!==we.numPlanes||De.numIntersection!==we.numIntersection)||De.vertexAlphas!==Pe||De.vertexTangents!==Fe||De.morphTargets!==Ue||De.morphNormals!==Ye||De.morphColors!==pt||De.toneMapping!==bt||De.morphTargetsCount!==_t)&&(tt=!0):(tt=!0,De.__version=k.version);let $t=De.currentProgram;tt===!0&&($t=Cs(k,F,B));let ki=!1,Zt=!1,Wr=!1;const xt=$t.getUniforms(),qt=De.uniforms;if(Ae.useProgram($t.program)&&(ki=!0,Zt=!0,Wr=!0),k.id!==J&&(J=k.id,Zt=!0),ki||Y!==x){Ae.buffers.depth.getReversed()&&x.reversedDepth!==!0&&(x._reversedDepth=!0,x.updateProjectionMatrix()),xt.setValue(C,"projectionMatrix",x.projectionMatrix),xt.setValue(C,"viewMatrix",x.matrixWorldInverse);const Kt=xt.map.cameraPosition;Kt!==void 0&&Kt.setValue(C,Je.setFromMatrixPosition(x.matrixWorld)),gt.logarithmicDepthBuffer&&xt.setValue(C,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&xt.setValue(C,"isOrthographic",x.isOrthographicCamera===!0),Y!==x&&(Y=x,Zt=!0,Wr=!0)}if(De.needsLights&&(dt.state.directionalShadowMap.length>0&&xt.setValue(C,"directionalShadowMap",dt.state.directionalShadowMap,N),dt.state.spotShadowMap.length>0&&xt.setValue(C,"spotShadowMap",dt.state.spotShadowMap,N),dt.state.pointShadowMap.length>0&&xt.setValue(C,"pointShadowMap",dt.state.pointShadowMap,N)),B.isSkinnedMesh){xt.setOptional(C,B,"bindMatrix"),xt.setOptional(C,B,"bindMatrixInverse");const Gt=B.skeleton;Gt&&(Gt.boneTexture===null&&Gt.computeBoneTexture(),xt.setValue(C,"boneTexture",Gt.boneTexture,N))}B.isBatchedMesh&&(xt.setOptional(C,B,"batchingTexture"),xt.setValue(C,"batchingTexture",B._matricesTexture,N),xt.setOptional(C,B,"batchingIdTexture"),xt.setValue(C,"batchingIdTexture",B._indirectTexture,N),xt.setOptional(C,B,"batchingColorTexture"),B._colorsTexture!==null&&xt.setValue(C,"batchingColorTexture",B._colorsTexture,N));const rn=z.morphAttributes;if((rn.position!==void 0||rn.normal!==void 0||rn.color!==void 0)&&Xe.update(B,z,$t),(Zt||De.receiveShadow!==B.receiveShadow)&&(De.receiveShadow=B.receiveShadow,xt.setValue(C,"receiveShadow",B.receiveShadow)),k.isMeshGouraudMaterial&&k.envMap!==null&&(qt.envMap.value=be,qt.flipEnvMap.value=be.isCubeTexture&&be.isRenderTargetTexture===!1?-1:1),k.isMeshStandardMaterial&&k.envMap===null&&F.environment!==null&&(qt.envMapIntensity.value=F.environmentIntensity),qt.dfgLUT!==void 0&&(qt.dfgLUT.value=oy()),Zt&&(xt.setValue(C,"toneMappingExposure",S.toneMappingExposure),De.needsLights&&Fd(qt,Wr),de&&k.fog===!0&&Oe.refreshFogUniforms(qt,de),Oe.refreshMaterialUniforms(qt,k,qe,je,I.state.transmissionRenderTarget[x.id]),ia.upload(C,Oc(De),qt,N)),k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(ia.upload(C,Oc(De),qt,N),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&xt.setValue(C,"center",B.center),xt.setValue(C,"modelViewMatrix",B.modelViewMatrix),xt.setValue(C,"normalMatrix",B.normalMatrix),xt.setValue(C,"modelMatrix",B.matrixWorld),k.isShaderMaterial||k.isRawShaderMaterial){const Gt=k.uniformsGroups;for(let Kt=0,Ea=Gt.length;Kt<Ea;Kt++){const ai=Gt[Kt];ie.update(ai,$t),ie.bind(ai,$t)}}return $t}function Fd(x,F){x.ambientLightColor.needsUpdate=F,x.lightProbe.needsUpdate=F,x.directionalLights.needsUpdate=F,x.directionalLightShadows.needsUpdate=F,x.pointLights.needsUpdate=F,x.pointLightShadows.needsUpdate=F,x.spotLights.needsUpdate=F,x.spotLightShadows.needsUpdate=F,x.rectAreaLights.needsUpdate=F,x.hemisphereLights.needsUpdate=F}function Bd(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return L},this.getActiveMipmapLevel=function(){return q},this.getRenderTarget=function(){return H},this.setRenderTargetTextures=function(x,F,z){const k=g.get(x);k.__autoAllocateDepthBuffer=x.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),g.get(x.texture).__webglTexture=F,g.get(x.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:z,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(x,F){const z=g.get(x);z.__webglFramebuffer=F,z.__useDefaultFramebuffer=F===void 0};const Od=C.createFramebuffer();this.setRenderTarget=function(x,F=0,z=0){H=x,L=F,q=z;let k=null,B=!1,de=!1;if(x){const pe=g.get(x);if(pe.__useDefaultFramebuffer!==void 0){Ae.bindFramebuffer(C.FRAMEBUFFER,pe.__webglFramebuffer),X.copy(x.viewport),G.copy(x.scissor),te=x.scissorTest,Ae.viewport(X),Ae.scissor(G),Ae.setScissorTest(te),J=-1;return}else if(pe.__webglFramebuffer===void 0)N.setupRenderTarget(x);else if(pe.__hasExternalTextures)N.rebindTextures(x,g.get(x.texture).__webglTexture,g.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){const Fe=x.depthTexture;if(pe.__boundDepthTexture!==Fe){if(Fe!==null&&g.has(Fe)&&(x.width!==Fe.image.width||x.height!==Fe.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");N.setupDepthRenderbuffer(x)}}const be=x.texture;(be.isData3DTexture||be.isDataArrayTexture||be.isCompressedArrayTexture)&&(de=!0);const Pe=g.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(Pe[F])?k=Pe[F][z]:k=Pe[F],B=!0):x.samples>0&&N.useMultisampledRTT(x)===!1?k=g.get(x).__webglMultisampledFramebuffer:Array.isArray(Pe)?k=Pe[z]:k=Pe,X.copy(x.viewport),G.copy(x.scissor),te=x.scissorTest}else X.copy($).multiplyScalar(qe).floor(),G.copy(ne).multiplyScalar(qe).floor(),te=Se;if(z!==0&&(k=Od),Ae.bindFramebuffer(C.FRAMEBUFFER,k)&&Ae.drawBuffers(x,k),Ae.viewport(X),Ae.scissor(G),Ae.setScissorTest(te),B){const pe=g.get(x.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_CUBE_MAP_POSITIVE_X+F,pe.__webglTexture,z)}else if(de){const pe=F;for(let be=0;be<x.textures.length;be++){const Pe=g.get(x.textures[be]);C.framebufferTextureLayer(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0+be,Pe.__webglTexture,z,pe)}}else if(x!==null&&z!==0){const pe=g.get(x.texture);C.framebufferTexture2D(C.FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,pe.__webglTexture,z)}J=-1},this.readRenderTargetPixels=function(x,F,z,k,B,de,ve,pe=0){if(!(x&&x.isWebGLRenderTarget)){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let be=g.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&ve!==void 0&&(be=be[ve]),be){Ae.bindFramebuffer(C.FRAMEBUFFER,be);try{const Pe=x.textures[pe],Fe=Pe.format,Ue=Pe.type;if(!gt.textureFormatReadable(Fe)){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!gt.textureTypeReadable(Ue)){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=x.width-k&&z>=0&&z<=x.height-B&&(x.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+pe),C.readPixels(F,z,k,B,se.convert(Fe),se.convert(Ue),de))}finally{const Pe=H!==null?g.get(H).__webglFramebuffer:null;Ae.bindFramebuffer(C.FRAMEBUFFER,Pe)}}},this.readRenderTargetPixelsAsync=async function(x,F,z,k,B,de,ve,pe=0){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let be=g.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&ve!==void 0&&(be=be[ve]),be)if(F>=0&&F<=x.width-k&&z>=0&&z<=x.height-B){Ae.bindFramebuffer(C.FRAMEBUFFER,be);const Pe=x.textures[pe],Fe=Pe.format,Ue=Pe.type;if(!gt.textureFormatReadable(Fe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!gt.textureTypeReadable(Ue))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ye=C.createBuffer();C.bindBuffer(C.PIXEL_PACK_BUFFER,Ye),C.bufferData(C.PIXEL_PACK_BUFFER,de.byteLength,C.STREAM_READ),x.textures.length>1&&C.readBuffer(C.COLOR_ATTACHMENT0+pe),C.readPixels(F,z,k,B,se.convert(Fe),se.convert(Ue),0);const pt=H!==null?g.get(H).__webglFramebuffer:null;Ae.bindFramebuffer(C.FRAMEBUFFER,pt);const bt=C.fenceSync(C.SYNC_GPU_COMMANDS_COMPLETE,0);return C.flush(),await Th(C,bt,4),C.bindBuffer(C.PIXEL_PACK_BUFFER,Ye),C.getBufferSubData(C.PIXEL_PACK_BUFFER,0,de),C.deleteBuffer(Ye),C.deleteSync(bt),de}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(x,F=null,z=0){const k=Math.pow(2,-z),B=Math.floor(x.image.width*k),de=Math.floor(x.image.height*k),ve=F!==null?F.x:0,pe=F!==null?F.y:0;N.setTexture2D(x,0),C.copyTexSubImage2D(C.TEXTURE_2D,z,0,0,ve,pe,B,de),Ae.unbindTexture()};const kd=C.createFramebuffer(),Vd=C.createFramebuffer();this.copyTextureToTexture=function(x,F,z=null,k=null,B=0,de=null){de===null&&(B!==0?(us("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),de=B,B=0):de=0);let ve,pe,be,Pe,Fe,Ue,Ye,pt,bt;const Mt=x.isCompressedTexture?x.mipmaps[de]:x.image;if(z!==null)ve=z.max.x-z.min.x,pe=z.max.y-z.min.y,be=z.isBox3?z.max.z-z.min.z:1,Pe=z.min.x,Fe=z.min.y,Ue=z.isBox3?z.min.z:0;else{const rn=Math.pow(2,-B);ve=Math.floor(Mt.width*rn),pe=Math.floor(Mt.height*rn),x.isDataArrayTexture?be=Mt.depth:x.isData3DTexture?be=Math.floor(Mt.depth*rn):be=1,Pe=0,Fe=0,Ue=0}k!==null?(Ye=k.x,pt=k.y,bt=k.z):(Ye=0,pt=0,bt=0);const _t=se.convert(F.format),De=se.convert(F.type);let dt;F.isData3DTexture?(N.setTexture3D(F,0),dt=C.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(N.setTexture2DArray(F,0),dt=C.TEXTURE_2D_ARRAY):(N.setTexture2D(F,0),dt=C.TEXTURE_2D),C.pixelStorei(C.UNPACK_FLIP_Y_WEBGL,F.flipY),C.pixelStorei(C.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),C.pixelStorei(C.UNPACK_ALIGNMENT,F.unpackAlignment);const tt=C.getParameter(C.UNPACK_ROW_LENGTH),$t=C.getParameter(C.UNPACK_IMAGE_HEIGHT),ki=C.getParameter(C.UNPACK_SKIP_PIXELS),Zt=C.getParameter(C.UNPACK_SKIP_ROWS),Wr=C.getParameter(C.UNPACK_SKIP_IMAGES);C.pixelStorei(C.UNPACK_ROW_LENGTH,Mt.width),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,Mt.height),C.pixelStorei(C.UNPACK_SKIP_PIXELS,Pe),C.pixelStorei(C.UNPACK_SKIP_ROWS,Fe),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Ue);const xt=x.isDataArrayTexture||x.isData3DTexture,qt=F.isDataArrayTexture||F.isData3DTexture;if(x.isDepthTexture){const rn=g.get(x),Gt=g.get(F),Kt=g.get(rn.__renderTarget),Ea=g.get(Gt.__renderTarget);Ae.bindFramebuffer(C.READ_FRAMEBUFFER,Kt.__webglFramebuffer),Ae.bindFramebuffer(C.DRAW_FRAMEBUFFER,Ea.__webglFramebuffer);for(let ai=0;ai<be;ai++)xt&&(C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,g.get(x).__webglTexture,B,Ue+ai),C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,g.get(F).__webglTexture,de,bt+ai)),C.blitFramebuffer(Pe,Fe,ve,pe,Ye,pt,ve,pe,C.DEPTH_BUFFER_BIT,C.NEAREST);Ae.bindFramebuffer(C.READ_FRAMEBUFFER,null),Ae.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else if(B!==0||x.isRenderTargetTexture||g.has(x)){const rn=g.get(x),Gt=g.get(F);Ae.bindFramebuffer(C.READ_FRAMEBUFFER,kd),Ae.bindFramebuffer(C.DRAW_FRAMEBUFFER,Vd);for(let Kt=0;Kt<be;Kt++)xt?C.framebufferTextureLayer(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,rn.__webglTexture,B,Ue+Kt):C.framebufferTexture2D(C.READ_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,rn.__webglTexture,B),qt?C.framebufferTextureLayer(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,Gt.__webglTexture,de,bt+Kt):C.framebufferTexture2D(C.DRAW_FRAMEBUFFER,C.COLOR_ATTACHMENT0,C.TEXTURE_2D,Gt.__webglTexture,de),B!==0?C.blitFramebuffer(Pe,Fe,ve,pe,Ye,pt,ve,pe,C.COLOR_BUFFER_BIT,C.NEAREST):qt?C.copyTexSubImage3D(dt,de,Ye,pt,bt+Kt,Pe,Fe,ve,pe):C.copyTexSubImage2D(dt,de,Ye,pt,Pe,Fe,ve,pe);Ae.bindFramebuffer(C.READ_FRAMEBUFFER,null),Ae.bindFramebuffer(C.DRAW_FRAMEBUFFER,null)}else qt?x.isDataTexture||x.isData3DTexture?C.texSubImage3D(dt,de,Ye,pt,bt,ve,pe,be,_t,De,Mt.data):F.isCompressedArrayTexture?C.compressedTexSubImage3D(dt,de,Ye,pt,bt,ve,pe,be,_t,Mt.data):C.texSubImage3D(dt,de,Ye,pt,bt,ve,pe,be,_t,De,Mt):x.isDataTexture?C.texSubImage2D(C.TEXTURE_2D,de,Ye,pt,ve,pe,_t,De,Mt.data):x.isCompressedTexture?C.compressedTexSubImage2D(C.TEXTURE_2D,de,Ye,pt,Mt.width,Mt.height,_t,Mt.data):C.texSubImage2D(C.TEXTURE_2D,de,Ye,pt,ve,pe,_t,De,Mt);C.pixelStorei(C.UNPACK_ROW_LENGTH,tt),C.pixelStorei(C.UNPACK_IMAGE_HEIGHT,$t),C.pixelStorei(C.UNPACK_SKIP_PIXELS,ki),C.pixelStorei(C.UNPACK_SKIP_ROWS,Zt),C.pixelStorei(C.UNPACK_SKIP_IMAGES,Wr),de===0&&F.generateMipmaps&&C.generateMipmap(dt),Ae.unbindTexture()},this.initRenderTarget=function(x){g.get(x).__webglFramebuffer===void 0&&N.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?N.setTextureCube(x,0):x.isData3DTexture?N.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?N.setTexture2DArray(x,0):N.setTexture2D(x,0),Ae.unbindTexture()},this.resetState=function(){L=0,q=0,H=null,Ae.reset(),ye.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return vn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Qe._getUnpackColorSpace()}}function ly(n,e){const t=new on(70,n/e,.1,1e3);return t.position.set(0,2,5.5),t}function uy(n,e,t){n.aspect=e/t,n.updateProjectionMatrix()}function dy(){return{ground:new pl({color:2042683,roughness:.95}),actor:new pl({color:9423359,roughness:.4,metalness:.1})}}function hy(n){n.ground.dispose(),n.actor.dispose()}function fy(){const n=new Jh;n.background=new it(659737);const e=new df(16777215,.45),t=new uf(16777215,1.15);return t.position.set(6,10,4),n.add(e),n.add(t),{scene:n,ambient:e,directional:t}}function py(n){const e=fy(),t=ly(n.clientWidth,n.clientHeight),i=dy(),s=new cy({antialias:!0});s.setPixelRatio(Math.min(window.devicePixelRatio,2)),s.setSize(n.clientWidth,n.clientHeight),n.innerHTML="",n.appendChild(s.domElement);const a=new pn(new Gr(1,1,1),i.actor);a.position.set(0,1,0),e.scene.add(a);const o=new pn(new As(20,20),i.ground);o.rotation.x=-Math.PI*.5,e.scene.add(o);let c=performance.now();const l=()=>{const u=n.clientWidth,d=n.clientHeight;uy(t,u,d),s.setSize(u,d)};return window.addEventListener("resize",l),{scene:e.scene,camera:t,materials:i,start(u){s.setAnimationLoop(()=>{const d=performance.now(),f=Math.min((d-c)/1e3,.1);c=d,u(f),s.render(e.scene,t)})},stop(){s.setAnimationLoop(null),window.removeEventListener("resize",l),hy(i),s.dispose(),n.innerHTML=""}}}function my(){return{name:"BuildClaimHousingRuntime",start(n){n.logger.info("build-claim-housing runtime start")},tick(){},stop(n){n.logger.info("build-claim-housing runtime stop")}}}function _y(){return{name:"CombatRuntime",start(n){n.logger.info("combat runtime start")},tick(){},stop(n){n.logger.info("combat runtime stop")}}}function gy(){return{name:"CoreRuntime",start(n){n.logger.info("core runtime start")},tick(n){n.world},stop(n){n.logger.info("core runtime stop")}}}function yy(){let n=0;return{name:"DiagnosticsRuntime",start(e){e.logger.info("diagnostics runtime start")},tick(e,t){n+=t,n>=5&&(e.logger.info("diagnostics heartbeat",{frame:e.frame,state:e.appState.value}),n=0)},stop(e){e.logger.info("diagnostics runtime stop")}}}function xy(){return{name:"InventoryTradeRuntime",start(n){n.logger.info("inventory-trade runtime start")},tick(){},stop(n){n.logger.info("inventory-trade runtime stop")}}}var Jr={},zl;function vy(){if(zl)return Jr;zl=1,Jr.byteLength=c,Jr.toByteArray=u,Jr.fromByteArray=p;for(var n=[],e=[],t=typeof Uint8Array<"u"?Uint8Array:Array,i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s=0,a=i.length;s<a;++s)n[s]=i[s],e[i.charCodeAt(s)]=s;e[45]=62,e[95]=63;function o(m){var y=m.length;if(y%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var v=m.indexOf("=");v===-1&&(v=y);var _=v===y?0:4-v%4;return[v,_]}function c(m){var y=o(m),v=y[0],_=y[1];return(v+_)*3/4-_}function l(m,y,v){return(y+v)*3/4-v}function u(m){var y,v=o(m),_=v[0],h=v[1],w=new t(l(m,_,h)),T=0,A=h>0?_-4:_,I;for(I=0;I<A;I+=4)y=e[m.charCodeAt(I)]<<18|e[m.charCodeAt(I+1)]<<12|e[m.charCodeAt(I+2)]<<6|e[m.charCodeAt(I+3)],w[T++]=y>>16&255,w[T++]=y>>8&255,w[T++]=y&255;return h===2&&(y=e[m.charCodeAt(I)]<<2|e[m.charCodeAt(I+1)]>>4,w[T++]=y&255),h===1&&(y=e[m.charCodeAt(I)]<<10|e[m.charCodeAt(I+1)]<<4|e[m.charCodeAt(I+2)]>>2,w[T++]=y>>8&255,w[T++]=y&255),w}function d(m){return n[m>>18&63]+n[m>>12&63]+n[m>>6&63]+n[m&63]}function f(m,y,v){for(var _,h=[],w=y;w<v;w+=3)_=(m[w]<<16&16711680)+(m[w+1]<<8&65280)+(m[w+2]&255),h.push(d(_));return h.join("")}function p(m){for(var y,v=m.length,_=v%3,h=[],w=16383,T=0,A=v-_;T<A;T+=w)h.push(f(m,T,T+w>A?A:T+w));return _===1?(y=m[v-1],h.push(n[y>>2]+n[y<<4&63]+"==")):_===2&&(y=(m[v-2]<<8)+m[v-1],h.push(n[y>>10]+n[y>>4&63]+n[y<<2&63]+"=")),h.join("")}return Jr}var Ju=vy(),Bn,kr=(Bn=class{constructor(e){le(this,"__time_duration_micros__");this.__time_duration_micros__=e}static getAlgebraicType(){return Me.Product({elements:[{name:"__time_duration_micros__",algebraicType:Me.I64}]})}static isTimeDuration(e){if(e.tag!=="Product")return!1;const t=e.value.elements;if(t.length!==1)return!1;const i=t[0];return i.name==="__time_duration_micros__"&&i.algebraicType.tag==="I64"}get micros(){return this.__time_duration_micros__}get millis(){return Number(this.micros/Bn.MICROS_PER_MILLIS)}static fromMillis(e){return new Bn(BigInt(e)*Bn.MICROS_PER_MILLIS)}toString(){const e=this.micros,t=e<0?"-":"+",i=e<0?-e:e,s=i/1000000n,a=i%1000000n;return`${t}${s}.${String(a).padStart(6,"0")}`}},le(Bn,"MICROS_PER_MILLIS",1000n),Bn),cn,hs=(cn=class{constructor(e){le(this,"__timestamp_micros_since_unix_epoch__");this.__timestamp_micros_since_unix_epoch__=e}get microsSinceUnixEpoch(){return this.__timestamp_micros_since_unix_epoch__}static getAlgebraicType(){return Me.Product({elements:[{name:"__timestamp_micros_since_unix_epoch__",algebraicType:Me.I64}]})}static isTimestamp(e){if(e.tag!=="Product")return!1;const t=e.value.elements;if(t.length!==1)return!1;const i=t[0];return i.name==="__timestamp_micros_since_unix_epoch__"&&i.algebraicType.tag==="I64"}static now(){return cn.fromDate(new Date)}toMillis(){return this.microsSinceUnixEpoch/1000n}static fromDate(e){const t=e.getTime(),i=BigInt(t)*cn.MICROS_PER_MILLIS;return new cn(i)}toDate(){const t=this.__timestamp_micros_since_unix_epoch__/cn.MICROS_PER_MILLIS;if(t>BigInt(Number.MAX_SAFE_INTEGER)||t<BigInt(Number.MIN_SAFE_INTEGER))throw new RangeError("Timestamp is outside of the representable range of JS's Date");return new Date(Number(t))}since(e){return new kr(this.__timestamp_micros_since_unix_epoch__-e.__timestamp_micros_since_unix_epoch__)}},le(cn,"MICROS_PER_MILLIS",1000n),le(cn,"UNIX_EPOCH",new cn(0n)),cn),At,Qu=(At=class{constructor(e){le(this,"__uuid__");if(e<0n||e>At.MAX_UUID_BIGINT)throw new Error("Invalid UUID: must be between 0 and `MAX_UUID_BIGINT`");this.__uuid__=e}static fromRandomBytesV4(e){if(e.length!==16)throw new Error("UUID v4 requires 16 bytes");const t=new Uint8Array(e);return t[6]=t[6]&15|64,t[8]=t[8]&63|128,new At(At.bytesToBigInt(t))}static fromCounterV7(e,t,i){if(i.length!==4)throw new Error("`fromCounterV7` requires `randomBytes.length == 4`");if(e.value<0)throw new Error("`fromCounterV7` uuid `counter` must be non-negative");if(t.__timestamp_micros_since_unix_epoch__<0)throw new Error("`fromCounterV7` `timestamp` before unix epoch");const s=e.value;e.value=s+1&2147483647;const a=t.toMillis()&0xffffffffffffn,o=new Uint8Array(16);return o[0]=Number(a>>40n&0xffn),o[1]=Number(a>>32n&0xffn),o[2]=Number(a>>24n&0xffn),o[3]=Number(a>>16n&0xffn),o[4]=Number(a>>8n&0xffn),o[5]=Number(a&0xffn),o[7]=s>>>23&255,o[9]=s>>>15&255,o[10]=s>>>7&255,o[11]=(s&127)<<1&255,o[12]|=i[0]&127,o[13]=i[1],o[14]=i[2],o[15]=i[3],o[6]=o[6]&15|112,o[8]=o[8]&63|128,new At(At.bytesToBigInt(o))}static parse(e){const t=e.replace(/-/g,"");if(t.length!==32)throw new Error("Invalid hex UUID");let i=0n;for(let s=0;s<32;s+=2)i=i<<8n|BigInt(parseInt(t.slice(s,s+2),16));return new At(i)}toString(){const t=[...At.bigIntToBytes(this.__uuid__)].map(i=>i.toString(16).padStart(2,"0")).join("");return t.slice(0,8)+"-"+t.slice(8,12)+"-"+t.slice(12,16)+"-"+t.slice(16,20)+"-"+t.slice(20)}asBigInt(){return this.__uuid__}toBytes(){return At.bigIntToBytes(this.__uuid__)}static bytesToBigInt(e){let t=0n;for(const i of e)t=t<<8n|BigInt(i);return t}static bigIntToBytes(e){const t=new Uint8Array(16);for(let i=15;i>=0;i--)t[i]=Number(e&0xffn),e>>=8n;return t}getVersion(){const e=this.toBytes()[6]>>4&15;switch(e){case 4:return"V4";case 7:return"V7";default:if(this==At.NIL)return"Nil";if(this==At.MAX)return"Max";throw new Error(`Unsupported UUID version: ${e}`)}}getCounter(){const e=this.toBytes(),t=e[7],i=e[9],s=e[10],a=e[11]>>>1;return t<<23|i<<15|s<<7|a|0}compareTo(e){return this.__uuid__<e.__uuid__?-1:this.__uuid__>e.__uuid__?1:0}static getAlgebraicType(){return Me.Product({elements:[{name:"__uuid__",algebraicType:Me.U128}]})}},le(At,"NIL",new At(0n)),le(At,"MAX_UUID_BIGINT",0xffffffffffffffffffffffffffffffffn),le(At,"MAX",new At(At.MAX_UUID_BIGINT)),At),jt,ht,Le,Tt,Pt,lu,Bi=(lu=class{constructor(n){Ge(this,Tt);Ge(this,jt);Ge(this,ht);Ge(this,Le,0);xe(this,jt,new Uint8Array(n)),xe(this,ht,new DataView(R(this,jt).buffer))}toBase64(){return Ju.fromByteArray(R(this,jt).subarray(0,R(this,Le)))}getBuffer(){return R(this,jt).slice(0,R(this,Le))}get offset(){return R(this,Le)}writeUInt8Array(n){const e=n.length;Ne(this,Tt,Pt).call(this,4+e),this.writeU32(e),R(this,jt).set(n,R(this,Le)),xe(this,Le,R(this,Le)+n.length)}writeBool(n){Ne(this,Tt,Pt).call(this,1),R(this,ht).setUint8(R(this,Le),n?1:0),xe(this,Le,R(this,Le)+1)}writeByte(n){Ne(this,Tt,Pt).call(this,1),R(this,ht).setUint8(R(this,Le),n),xe(this,Le,R(this,Le)+1)}writeI8(n){Ne(this,Tt,Pt).call(this,1),R(this,ht).setInt8(R(this,Le),n),xe(this,Le,R(this,Le)+1)}writeU8(n){Ne(this,Tt,Pt).call(this,1),R(this,ht).setUint8(R(this,Le),n),xe(this,Le,R(this,Le)+1)}writeI16(n){Ne(this,Tt,Pt).call(this,2),R(this,ht).setInt16(R(this,Le),n,!0),xe(this,Le,R(this,Le)+2)}writeU16(n){Ne(this,Tt,Pt).call(this,2),R(this,ht).setUint16(R(this,Le),n,!0),xe(this,Le,R(this,Le)+2)}writeI32(n){Ne(this,Tt,Pt).call(this,4),R(this,ht).setInt32(R(this,Le),n,!0),xe(this,Le,R(this,Le)+4)}writeU32(n){Ne(this,Tt,Pt).call(this,4),R(this,ht).setUint32(R(this,Le),n,!0),xe(this,Le,R(this,Le)+4)}writeI64(n){Ne(this,Tt,Pt).call(this,8),R(this,ht).setBigInt64(R(this,Le),n,!0),xe(this,Le,R(this,Le)+8)}writeU64(n){Ne(this,Tt,Pt).call(this,8),R(this,ht).setBigUint64(R(this,Le),n,!0),xe(this,Le,R(this,Le)+8)}writeU128(n){Ne(this,Tt,Pt).call(this,16);const e=n&BigInt("0xFFFFFFFFFFFFFFFF"),t=n>>BigInt(64);R(this,ht).setBigUint64(R(this,Le),e,!0),R(this,ht).setBigUint64(R(this,Le)+8,t,!0),xe(this,Le,R(this,Le)+16)}writeI128(n){Ne(this,Tt,Pt).call(this,16);const e=n&BigInt("0xFFFFFFFFFFFFFFFF"),t=n>>BigInt(64);R(this,ht).setBigInt64(R(this,Le),e,!0),R(this,ht).setBigInt64(R(this,Le)+8,t,!0),xe(this,Le,R(this,Le)+16)}writeU256(n){Ne(this,Tt,Pt).call(this,32);const e=BigInt("0xFFFFFFFFFFFFFFFF"),t=n&e,i=n>>BigInt(64)&e,s=n>>BigInt(128)&e,a=n>>BigInt(192);R(this,ht).setBigUint64(R(this,Le)+0,t,!0),R(this,ht).setBigUint64(R(this,Le)+8,i,!0),R(this,ht).setBigUint64(R(this,Le)+16,s,!0),R(this,ht).setBigUint64(R(this,Le)+24,a,!0),xe(this,Le,R(this,Le)+32)}writeI256(n){Ne(this,Tt,Pt).call(this,32);const e=BigInt("0xFFFFFFFFFFFFFFFF"),t=n&e,i=n>>BigInt(64)&e,s=n>>BigInt(128)&e,a=n>>BigInt(192);R(this,ht).setBigUint64(R(this,Le)+0,t,!0),R(this,ht).setBigUint64(R(this,Le)+8,i,!0),R(this,ht).setBigUint64(R(this,Le)+16,s,!0),R(this,ht).setBigInt64(R(this,Le)+24,a,!0),xe(this,Le,R(this,Le)+32)}writeF32(n){Ne(this,Tt,Pt).call(this,4),R(this,ht).setFloat32(R(this,Le),n,!0),xe(this,Le,R(this,Le)+4)}writeF64(n){Ne(this,Tt,Pt).call(this,8),R(this,ht).setFloat64(R(this,Le),n,!0),xe(this,Le,R(this,Le)+8)}writeString(n){const t=new TextEncoder().encode(n);this.writeU32(t.length),Ne(this,Tt,Pt).call(this,t.length),R(this,jt).set(t,R(this,Le)),xe(this,Le,R(this,Le)+t.length)}},jt=new WeakMap,ht=new WeakMap,Le=new WeakMap,Tt=new WeakSet,Pt=function(n){const e=R(this,Le)+n+1;if(e<=R(this,jt).length)return;let t=R(this,jt).length*2;t<e&&(t=e);const i=new Uint8Array(t);i.set(R(this,jt)),xe(this,jt,i),xe(this,ht,new DataView(R(this,jt).buffer))},lu),st,Be,ua,ed,uu,Ri=(uu=class{constructor(n){Ge(this,ua);Ge(this,st);Ge(this,Be,0);xe(this,st,new DataView(n.buffer,n.byteOffset,n.byteLength)),xe(this,Be,0)}get offset(){return R(this,Be)}get remaining(){return R(this,st).byteLength-R(this,Be)}readUInt8Array(){const n=this.readU32();return Ne(this,ua,ed).call(this,n),this.readBytes(n)}readBool(){const n=R(this,st).getUint8(R(this,Be));return xe(this,Be,R(this,Be)+1),n!==0}readByte(){const n=R(this,st).getUint8(R(this,Be));return xe(this,Be,R(this,Be)+1),n}readBytes(n){const e=new Uint8Array(R(this,st).buffer,R(this,st).byteOffset+R(this,Be),n);return xe(this,Be,R(this,Be)+n),e}readI8(){const n=R(this,st).getInt8(R(this,Be));return xe(this,Be,R(this,Be)+1),n}readU8(){return this.readByte()}readI16(){const n=R(this,st).getInt16(R(this,Be),!0);return xe(this,Be,R(this,Be)+2),n}readU16(){const n=R(this,st).getUint16(R(this,Be),!0);return xe(this,Be,R(this,Be)+2),n}readI32(){const n=R(this,st).getInt32(R(this,Be),!0);return xe(this,Be,R(this,Be)+4),n}readU32(){const n=R(this,st).getUint32(R(this,Be),!0);return xe(this,Be,R(this,Be)+4),n}readI64(){const n=R(this,st).getBigInt64(R(this,Be),!0);return xe(this,Be,R(this,Be)+8),n}readU64(){const n=R(this,st).getBigUint64(R(this,Be),!0);return xe(this,Be,R(this,Be)+8),n}readU128(){const n=R(this,st).getBigUint64(R(this,Be),!0),e=R(this,st).getBigUint64(R(this,Be)+8,!0);return xe(this,Be,R(this,Be)+16),(e<<BigInt(64))+n}readI128(){const n=R(this,st).getBigUint64(R(this,Be),!0),e=R(this,st).getBigInt64(R(this,Be)+8,!0);return xe(this,Be,R(this,Be)+16),(e<<BigInt(64))+n}readU256(){const n=R(this,st).getBigUint64(R(this,Be),!0),e=R(this,st).getBigUint64(R(this,Be)+8,!0),t=R(this,st).getBigUint64(R(this,Be)+16,!0),i=R(this,st).getBigUint64(R(this,Be)+24,!0);return xe(this,Be,R(this,Be)+32),(i<<BigInt(192))+(t<<BigInt(128))+(e<<BigInt(64))+n}readI256(){const n=R(this,st).getBigUint64(R(this,Be),!0),e=R(this,st).getBigUint64(R(this,Be)+8,!0),t=R(this,st).getBigUint64(R(this,Be)+16,!0),i=R(this,st).getBigInt64(R(this,Be)+24,!0);return xe(this,Be,R(this,Be)+32),(i<<BigInt(192))+(t<<BigInt(128))+(e<<BigInt(64))+n}readF32(){const n=R(this,st).getFloat32(R(this,Be),!0);return xe(this,Be,R(this,Be)+4),n}readF64(){const n=R(this,st).getFloat64(R(this,Be),!0);return xe(this,Be,R(this,Be)+8),n}readString(){const n=this.readUInt8Array();return new TextDecoder("utf-8").decode(n)}},st=new WeakMap,Be=new WeakMap,ua=new WeakSet,ed=function(n){if(R(this,Be)+n>R(this,st).byteLength)throw new RangeError(`Tried to read ${n} byte(s) at relative offset ${R(this,Be)}, but only ${this.remaining} byte(s) remain`)},uu);function fs(n){const e=n.replace(/([-_][a-z])/gi,t=>t.toUpperCase().replace("-","").replace("_",""));return e.charAt(0).toUpperCase()+e.slice(1)}function rs(n,e){if(n===e)return!0;if(typeof n!="object"||n===null||typeof e!="object"||e===null)return!1;const t=Object.keys(n),i=Object.keys(e);if(t.length!==i.length)return!1;for(const s of t)if(!i.includes(s)||!rs(n[s],e[s]))return!1;return!0}function td(n){return Array.prototype.map.call(n.reverse(),e=>("00"+e.toString(16)).slice(-2)).join("")}function Sy(n){if(n.length!=16)throw new Error(`Uint8Array is not 16 bytes long: ${n}`);return new Ri(n).readU128()}function by(n){if(n.length!=32)throw new Error(`Uint8Array is not 32 bytes long: [${n}]`);return new Ri(n).readU256()}function nd(n){n.startsWith("0x")&&(n=n.slice(2));const e=n.match(/.{1,2}/g)||[];return Uint8Array.from(e.map(i=>parseInt(i,16))).reverse()}function My(n){return Sy(nd(n))}function wy(n){return by(nd(n))}function id(n){const e=new Bi(16);return e.writeU128(n),e.getBuffer()}function Ey(n){return td(id(n))}function rd(n){const e=new Bi(32);return e.writeU256(n),e.getBuffer()}function Ty(n){return td(rd(n))}function as(n){return n.replace(/[-_]+/g,"_").replace(/_([a-zA-Z0-9])/g,(e,t)=>t.toUpperCase())}function os(n,e){for(;e.tag==="Ref";)e=n.types[e.value];if(e.tag==="Product"){let i=0;for(const{algebraicType:s}of e.value.elements)i+=os(n,s);return i}else if(e.tag==="Sum"){let i=1/0;for(const{algebraicType:s}of e.value.variants){const a=os(n,s);a<i&&(i=a)}return i===1/0&&(i=0),4+i}else if(e.tag=="Array")return 4+4*os(n,e.value);return{String:8,Sum:1,Bool:1,I8:1,U8:1,I16:2,U16:2,I32:4,U32:4,F32:4,I64:8,U64:8,F64:8,I128:16,U128:16,I256:32,U256:32}[e.tag]}var sd=class ec{constructor(e){le(this,"__identity__");this.__identity__=typeof e=="string"?wy(e):e}static getAlgebraicType(){return Me.Product({elements:[{name:"__identity__",algebraicType:Me.U256}]})}isEqual(e){return this.toHexString()===e.toHexString()}equals(e){return this.isEqual(e)}toHexString(){return Ty(this.__identity__)}toUint8Array(){return rd(this.__identity__)}static fromString(e){return new ec(e)}static zero(){return new ec(0n)}toString(){return this.toHexString()}},Me={Ref:n=>({tag:"Ref",value:n}),Sum:n=>({tag:"Sum",value:n}),Product:n=>({tag:"Product",value:n}),Array:n=>({tag:"Array",value:n}),String:{tag:"String"},Bool:{tag:"Bool"},I8:{tag:"I8"},U8:{tag:"U8"},I16:{tag:"I16"},U16:{tag:"U16"},I32:{tag:"I32"},U32:{tag:"U32"},I64:{tag:"I64"},U64:{tag:"U64"},I128:{tag:"I128"},U128:{tag:"U128"},I256:{tag:"I256"},U256:{tag:"U256"},F32:{tag:"F32"},F64:{tag:"F64"},serializeValue(n,e,t,i){if(e.tag==="Ref"){if(!i)throw new Error("cannot serialize refs without a typespace");for(;e.tag==="Ref";)e=i.types[e.value]}switch(e.tag){case"Product":Ui.serializeValue(n,e.value,t,i);break;case"Sum":Gl.serializeValue(n,e.value,t,i);break;case"Array":if(e.value.tag==="U8")n.writeUInt8Array(t);else{const s=e.value;n.writeU32(t.length);for(const a of t)Me.serializeValue(n,s,a,i)}break;case"Bool":n.writeBool(t);break;case"I8":n.writeI8(t);break;case"U8":n.writeU8(t);break;case"I16":n.writeI16(t);break;case"U16":n.writeU16(t);break;case"I32":n.writeI32(t);break;case"U32":n.writeU32(t);break;case"I64":n.writeI64(t);break;case"U64":n.writeU64(t);break;case"I128":n.writeI128(t);break;case"U128":n.writeU128(t);break;case"I256":n.writeI256(t);break;case"U256":n.writeU256(t);break;case"F32":n.writeF32(t);break;case"F64":n.writeF64(t);break;case"String":n.writeString(t);break}},deserializeValue:function(n,e,t){if(e.tag==="Ref"){if(!t)throw new Error("cannot deserialize refs without a typespace");for(;e.tag==="Ref";)e=t.types[e.value]}switch(e.tag){case"Product":return Ui.deserializeValue(n,e.value,t);case"Sum":return Gl.deserializeValue(n,e.value,t);case"Array":if(e.value.tag==="U8")return n.readUInt8Array();{const i=e.value,s=n.readU32(),a=[];for(let o=0;o<s;o++)a.push(Me.deserializeValue(n,i,t));return a}case"Bool":return n.readBool();case"I8":return n.readI8();case"U8":return n.readU8();case"I16":return n.readI16();case"U16":return n.readU16();case"I32":return n.readI32();case"U32":return n.readU32();case"I64":return n.readI64();case"U64":return n.readU64();case"I128":return n.readI128();case"U128":return n.readU128();case"I256":return n.readI256();case"U256":return n.readU256();case"F32":return n.readF32();case"F64":return n.readF64();case"String":return n.readString()}},intoMapKey:function(n,e){switch(n.tag){case"U8":case"U16":case"U32":case"U64":case"U128":case"U256":case"I8":case"I16":case"I32":case"I64":case"I128":case"I256":case"F32":case"F64":case"String":case"Bool":return e;case"Product":return Ui.intoMapKey(n.value,e);default:{const t=new Bi(10);return Me.serializeValue(t,n,e),t.toBase64()}}}},Ui={serializeValue(n,e,t,i){for(const s of e.elements)Me.serializeValue(n,s.algebraicType,t[s.name],i)},deserializeValue(n,e,t){const i={};if(e.elements.length===1){if(e.elements[0].name==="__time_duration_micros__")return new kr(n.readI64());if(e.elements[0].name==="__timestamp_micros_since_unix_epoch__")return new hs(n.readI64());if(e.elements[0].name==="__identity__")return new sd(n.readU256());if(e.elements[0].name==="__connection_id__")return new ca(n.readU128());if(e.elements[0].name==="__uuid__")return new Qu(n.readU128())}for(const s of e.elements)i[s.name]=Me.deserializeValue(n,s.algebraicType,t);return i},intoMapKey(n,e){if(n.elements.length===1){if(n.elements[0].name==="__time_duration_micros__")return e.__time_duration_micros__;if(n.elements[0].name==="__timestamp_micros_since_unix_epoch__")return e.__timestamp_micros_since_unix_epoch__;if(n.elements[0].name==="__identity__")return e.__identity__;if(n.elements[0].name==="__connection_id__")return e.__connection_id__;if(n.elements[0].name==="__uuid__")return e.__uuid__}const t=new Bi(10);return Me.serializeValue(t,Me.Product(n),e),t.toBase64()}},Gl={serializeValue:function(n,e,t,i){if(e.variants.length==2&&e.variants[0].name==="some"&&e.variants[1].name==="none")t!=null?(n.writeByte(0),Me.serializeValue(n,e.variants[0].algebraicType,t,i)):n.writeByte(1);else if(e.variants.length==2&&e.variants[0].name==="ok"&&e.variants[1].name==="err"){let s,a,o;if("ok"in t?(s="ok",a=t.ok,o=0):(s="err",a=t.err,o=1),o<0)throw`Result serialization error: variant '${s}' not found in ${JSON.stringify(e)}`;n.writeU8(o),Me.serializeValue(n,e.variants[o].algebraicType,a,i)}else{const s=t.tag,a=e.variants.findIndex(o=>o.name===s);if(a<0)throw`Can't serialize a sum type, couldn't find ${t.tag} tag ${JSON.stringify(t)} in variants ${JSON.stringify(e)}`;n.writeU8(a),Me.serializeValue(n,e.variants[a].algebraicType,t.value,i)}},deserializeValue:function(n,e,t){const i=n.readU8();if(e.variants.length==2&&e.variants[0].name==="some"&&e.variants[1].name==="none"){if(i===0)return Me.deserializeValue(n,e.variants[0].algebraicType,t);if(i===1)return;throw`Can't deserialize an option type, couldn't find ${i} tag`}else if(e.variants.length==2&&e.variants[0].name==="ok"&&e.variants[1].name==="err"){if(i===0)return{ok:Me.deserializeValue(n,e.variants[0].algebraicType,t)};if(i===1)return{err:Me.deserializeValue(n,e.variants[1].algebraicType,t)};throw`Can't deserialize a result type, couldn't find ${i} tag`}else{const s=e.variants[i],a=Me.deserializeValue(n,s.algebraicType,t);return{tag:s.name,value:a}}}},ca=class ra{constructor(e){le(this,"__connection_id__");this.__connection_id__=e}static getAlgebraicType(){return Me.Product({elements:[{name:"__connection_id__",algebraicType:Me.U128}]})}isZero(){return this.__connection_id__===BigInt(0)}static nullIfZero(e){return e.isZero()?null:e}static random(){function e(){return Math.floor(Math.random()*255)}let t=BigInt(0);for(let i=0;i<16;i++)t=t<<BigInt(8)|BigInt(e());return new ra(t)}isEqual(e){return this.__connection_id__==e.__connection_id__}equals(e){return this.isEqual(e)}toHexString(){return Ey(this.__connection_id__)}toUint8Array(){return id(this.__connection_id__)}static fromString(e){return new ra(My(e))}static fromStringOrNull(e){const t=ra.fromString(e);return t.isZero()?null:t}},Ay={interval(n){return Iy(n)},time(n){return Ry(n)},getAlgebraicType(){return Me.Sum({variants:[{name:"Interval",algebraicType:kr.getAlgebraicType()},{name:"Time",algebraicType:hs.getAlgebraicType()}]})},isScheduleAt(n){if(n.tag!=="Sum")return!1;const e=n.value.variants;if(e.length!==2)return!1;const t=e.find(s=>s.name==="Interval"),i=e.find(s=>s.name==="Time");return!t||!i?!1:kr.isTimeDuration(t.algebraicType)&&hs.isTimestamp(i.algebraicType)}},Iy=n=>({tag:"Interval",value:new kr(n)}),Ry=n=>({tag:"Time",value:new hs(n)}),ad=Ay,Cy={getAlgebraicType(n){return Me.Sum({variants:[{name:"some",algebraicType:n},{name:"none",algebraicType:Me.Product({elements:[]})}]})}},Py={getAlgebraicType(n,e){return Me.Sum({variants:[{name:"ok",algebraicType:n},{name:"err",algebraicType:e}]})}},Uy=Symbol("QueryBrand"),Dy=n=>!!n&&typeof n=="object"&&Uy in n;function Ly(n){return n.toSql()}function E(n,e){return{...n,...e}}var rt=class{constructor(n){le(this,"type");le(this,"algebraicType");this.algebraicType=n}optional(){return new la(this)}serialize(n,e){Me.serializeValue(n,this.algebraicType,e)}deserialize(n){return Me.deserializeValue(n,this.algebraicType)}},Ny=class extends rt{constructor(){super(Me.U8)}index(n="btree"){return new er(this,E(W,{indexType:n}))}unique(){return new er(this,E(W,{isUnique:!0}))}primaryKey(){return new er(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new er(this,E(W,{isAutoIncrement:!0}))}default(n){return new er(this,E(W,{defaultValue:n}))}name(n){return new er(this,E(W,{name:n}))}},Fy=class extends rt{constructor(){super(Me.U16)}index(n="btree"){return new tr(this,E(W,{indexType:n}))}unique(){return new tr(this,E(W,{isUnique:!0}))}primaryKey(){return new tr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new tr(this,E(W,{isAutoIncrement:!0}))}default(n){return new tr(this,E(W,{defaultValue:n}))}name(n){return new tr(this,E(W,{name:n}))}},By=class extends rt{constructor(){super(Me.U32)}index(n="btree"){return new nr(this,E(W,{indexType:n}))}unique(){return new nr(this,E(W,{isUnique:!0}))}primaryKey(){return new nr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new nr(this,E(W,{isAutoIncrement:!0}))}default(n){return new nr(this,E(W,{defaultValue:n}))}name(n){return new nr(this,E(W,{name:n}))}},Oy=class extends rt{constructor(){super(Me.U64)}index(n="btree"){return new ir(this,E(W,{indexType:n}))}unique(){return new ir(this,E(W,{isUnique:!0}))}primaryKey(){return new ir(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new ir(this,E(W,{isAutoIncrement:!0}))}default(n){return new ir(this,E(W,{defaultValue:n}))}name(n){return new ir(this,E(W,{name:n}))}},ky=class extends rt{constructor(){super(Me.U128)}index(n="btree"){return new rr(this,E(W,{indexType:n}))}unique(){return new rr(this,E(W,{isUnique:!0}))}primaryKey(){return new rr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new rr(this,E(W,{isAutoIncrement:!0}))}default(n){return new rr(this,E(W,{defaultValue:n}))}name(n){return new rr(this,E(W,{name:n}))}},Vy=class extends rt{constructor(){super(Me.U256)}index(n="btree"){return new sr(this,E(W,{indexType:n}))}unique(){return new sr(this,E(W,{isUnique:!0}))}primaryKey(){return new sr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new sr(this,E(W,{isAutoIncrement:!0}))}default(n){return new sr(this,E(W,{defaultValue:n}))}name(n){return new sr(this,E(W,{name:n}))}},zy=class extends rt{constructor(){super(Me.I8)}index(n="btree"){return new ar(this,E(W,{indexType:n}))}unique(){return new ar(this,E(W,{isUnique:!0}))}primaryKey(){return new ar(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new ar(this,E(W,{isAutoIncrement:!0}))}default(n){return new ar(this,E(W,{defaultValue:n}))}name(n){return new ar(this,E(W,{name:n}))}},Gy=class extends rt{constructor(){super(Me.I16)}index(n="btree"){return new or(this,E(W,{indexType:n}))}unique(){return new or(this,E(W,{isUnique:!0}))}primaryKey(){return new or(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new or(this,E(W,{isAutoIncrement:!0}))}default(n){return new or(this,E(W,{defaultValue:n}))}name(n){return new or(this,E(W,{name:n}))}},Hy=class extends rt{constructor(){super(Me.I32)}index(n="btree"){return new cr(this,E(W,{indexType:n}))}unique(){return new cr(this,E(W,{isUnique:!0}))}primaryKey(){return new cr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new cr(this,E(W,{isAutoIncrement:!0}))}default(n){return new cr(this,E(W,{defaultValue:n}))}name(n){return new cr(this,E(W,{name:n}))}},Wy=class extends rt{constructor(){super(Me.I64)}index(n="btree"){return new lr(this,E(W,{indexType:n}))}unique(){return new lr(this,E(W,{isUnique:!0}))}primaryKey(){return new lr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new lr(this,E(W,{isAutoIncrement:!0}))}default(n){return new lr(this,E(W,{defaultValue:n}))}name(n){return new lr(this,E(W,{name:n}))}},qy=class extends rt{constructor(){super(Me.I128)}index(n="btree"){return new ur(this,E(W,{indexType:n}))}unique(){return new ur(this,E(W,{isUnique:!0}))}primaryKey(){return new ur(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new ur(this,E(W,{isAutoIncrement:!0}))}default(n){return new ur(this,E(W,{defaultValue:n}))}name(n){return new ur(this,E(W,{name:n}))}},Ky=class extends rt{constructor(){super(Me.I256)}index(n="btree"){return new dr(this,E(W,{indexType:n}))}unique(){return new dr(this,E(W,{isUnique:!0}))}primaryKey(){return new dr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new dr(this,E(W,{isAutoIncrement:!0}))}default(n){return new dr(this,E(W,{defaultValue:n}))}name(n){return new dr(this,E(W,{name:n}))}},Xy=class extends rt{constructor(){super(Me.F32)}default(n){return new Wl(this,E(W,{defaultValue:n}))}name(n){return new Wl(this,E(W,{name:n}))}},Hl=class extends rt{constructor(){super(Me.F64)}default(n){return new ql(this,E(W,{defaultValue:n}))}name(n){return new ql(this,E(W,{name:n}))}},jy=class extends rt{constructor(){super(Me.Bool)}index(n="btree"){return new Qr(this,E(W,{indexType:n}))}unique(){return new Qr(this,E(W,{isUnique:!0}))}primaryKey(){return new Qr(this,E(W,{isPrimaryKey:!0}))}default(n){return new Qr(this,E(W,{defaultValue:n}))}name(n){return new Qr(this,E(W,{name:n}))}},Yy=class extends rt{constructor(){super(Me.String)}index(n="btree"){return new es(this,E(W,{indexType:n}))}unique(){return new es(this,E(W,{isUnique:!0}))}primaryKey(){return new es(this,E(W,{isPrimaryKey:!0}))}default(n){return new es(this,E(W,{defaultValue:n}))}name(n){return new es(this,E(W,{name:n}))}},tc=class extends rt{constructor(e){super(Me.Array(e.algebraicType));le(this,"element");this.element=e}default(e){return new Kl(this.element,E(W,{defaultValue:e}))}name(e){return new Kl(this.element,E(W,{name:e}))}},$y=class extends rt{constructor(){super(Me.Array(Me.U8))}default(n){return new Xl(E(W,{defaultValue:n}))}name(n){return new Xl(E(W,{name:n}))}},la=class extends rt{constructor(e){super(Cy.getAlgebraicType(e.algebraicType));le(this,"value");this.value=e}default(e){return new jl(this,E(W,{defaultValue:e}))}name(e){return new jl(this,E(W,{name:e}))}},Vr=class extends rt{constructor(e,t){function i(s){return Object.keys(s).map(a=>({name:a,get algebraicType(){return s[a].algebraicType}}))}super(Me.Product({elements:i(e)}));le(this,"typeName");le(this,"elements");this.typeName=t,this.elements=e}default(e){return new Yl(this,E(W,{defaultValue:e}))}name(e){return new Yl(this,E(W,{name:e}))}},nc=class extends rt{constructor(e,t){super(Py.getAlgebraicType(e.algebraicType,t.algebraicType));le(this,"ok");le(this,"err");this.ok=e,this.err=t}default(e){return new rx(this,E(W,{defaultValue:e}))}},Rc=class extends rt{constructor(){super({tag:"Product",value:{elements:[]}})}},An=class extends rt{constructor(e,t){const i=Object.fromEntries(Object.entries(e).map(([a,o])=>[a,o instanceof ct?o:new ct(o,{})])),s=Object.keys(i).map(a=>({name:a,get algebraicType(){return i[a].typeBuilder.algebraicType}}));super(Me.Product({elements:s}));le(this,"row");le(this,"typeName");this.row=i,this.typeName=t}},od=class extends rt{constructor(e,t){function i(s){return Object.keys(s).map(a=>({name:a,get algebraicType(){return s[a].algebraicType}}))}super(Me.Sum({variants:i(e)}));le(this,"variants");le(this,"typeName");this.variants=e,this.typeName=t;for(const s of Object.keys(e)){const a=Object.getOwnPropertyDescriptor(e,s),o=!!a&&(typeof a.get=="function"||typeof a.set=="function");let c=!1;if(o||(c=e[s]instanceof Rc),c){const l=this.create(s);Object.defineProperty(this,s,{value:l,writable:!1,enumerable:!0,configurable:!1})}else Object.defineProperty(this,s,{value:(u=>this.create(s,u)),writable:!1,enumerable:!0,configurable:!1})}}create(e,t){return t===void 0?{tag:e}:{tag:e,value:t}}default(e){return new lc(this,E(W,{defaultValue:e}))}name(e){return new lc(this,E(W,{name:e}))}},Cc=od,Zy=class extends od{index(n="btree"){return new $l(this,E(W,{indexType:n}))}primaryKey(){return new $l(this,E(W,{isPrimaryKey:!0}))}},Jy=class extends rt{constructor(){super(ad.getAlgebraicType())}default(n){return new Zl(this,E(W,{defaultValue:n}))}name(n){return new Zl(this,E(W,{name:n}))}},Qy=class extends rt{constructor(){super(sd.getAlgebraicType())}index(n="btree"){return new hr(this,E(W,{indexType:n}))}unique(){return new hr(this,E(W,{isUnique:!0}))}primaryKey(){return new hr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new hr(this,E(W,{isAutoIncrement:!0}))}default(n){return new hr(this,E(W,{defaultValue:n}))}name(n){return new hr(this,E(W,{name:n}))}},ex=class extends rt{constructor(){super(ca.getAlgebraicType())}index(n="btree"){return new fr(this,E(W,{indexType:n}))}unique(){return new fr(this,E(W,{isUnique:!0}))}primaryKey(){return new fr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new fr(this,E(W,{isAutoIncrement:!0}))}default(n){return new fr(this,E(W,{defaultValue:n}))}name(n){return new fr(this,E(W,{name:n}))}},tx=class extends rt{constructor(){super(hs.getAlgebraicType())}index(n="btree"){return new pr(this,E(W,{indexType:n}))}unique(){return new pr(this,E(W,{isUnique:!0}))}primaryKey(){return new pr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new pr(this,E(W,{isAutoIncrement:!0}))}default(n){return new pr(this,E(W,{defaultValue:n}))}name(n){return new pr(this,E(W,{name:n}))}},nx=class extends rt{constructor(){super(kr.getAlgebraicType())}index(n="btree"){return new mr(this,E(W,{indexType:n}))}unique(){return new mr(this,E(W,{isUnique:!0}))}primaryKey(){return new mr(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new mr(this,E(W,{isAutoIncrement:!0}))}default(n){return new mr(this,E(W,{defaultValue:n}))}name(n){return new mr(this,E(W,{name:n}))}},ix=class extends rt{constructor(){super(Qu.getAlgebraicType())}index(n="btree"){return new _r(this,E(W,{indexType:n}))}unique(){return new _r(this,E(W,{isUnique:!0}))}primaryKey(){return new _r(this,E(W,{isPrimaryKey:!0}))}autoInc(){return new _r(this,E(W,{isAutoIncrement:!0}))}default(n){return new _r(this,E(W,{defaultValue:n}))}name(n){return new _r(this,E(W,{name:n}))}},W={},ct=class{constructor(n,e){le(this,"typeBuilder");le(this,"columnMetadata");this.typeBuilder=n,this.columnMetadata=e}serialize(n,e){Me.serializeValue(n,this.typeBuilder.algebraicType,e)}deserialize(n){return Me.deserializeValue(n,this.typeBuilder.algebraicType)}},er=class pi extends ct{index(e="btree"){return new pi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new pi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new pi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new pi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new pi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new pi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},tr=class mi extends ct{index(e="btree"){return new mi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new mi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new mi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new mi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new mi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new mi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},nr=class _i extends ct{index(e="btree"){return new _i(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new _i(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new _i(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new _i(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new _i(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new _i(this.typeBuilder,E(this.columnMetadata,{name:e}))}},ir=class gi extends ct{index(e="btree"){return new gi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new gi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new gi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new gi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new gi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new gi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},rr=class yi extends ct{index(e="btree"){return new yi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new yi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new yi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new yi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new yi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new yi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},sr=class xi extends ct{index(e="btree"){return new xi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new xi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new xi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new xi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new xi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new xi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},ar=class vi extends ct{index(e="btree"){return new vi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new vi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new vi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new vi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new vi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new vi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},or=class Si extends ct{index(e="btree"){return new Si(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new Si(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new Si(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new Si(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new Si(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new Si(this.typeBuilder,E(this.columnMetadata,{name:e}))}},cr=class bi extends ct{index(e="btree"){return new bi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new bi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new bi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new bi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new bi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new bi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},lr=class Mi extends ct{index(e="btree"){return new Mi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new Mi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new Mi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new Mi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new Mi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new Mi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},ur=class wi extends ct{index(e="btree"){return new wi(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new wi(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new wi(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new wi(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new wi(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new wi(this.typeBuilder,E(this.columnMetadata,{name:e}))}},dr=class Ei extends ct{index(e="btree"){return new Ei(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new Ei(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new Ei(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}autoInc(){return new Ei(this.typeBuilder,E(this.columnMetadata,{isAutoIncrement:!0}))}default(e){return new Ei(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new Ei(this.typeBuilder,E(this.columnMetadata,{name:e}))}},Wl=class ic extends ct{default(e){return new ic(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new ic(this.typeBuilder,E(this.columnMetadata,{name:e}))}},ql=class rc extends ct{default(e){return new rc(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new rc(this.typeBuilder,E(this.columnMetadata,{name:e}))}},Qr=class gr extends ct{index(e="btree"){return new gr(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new gr(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new gr(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new gr(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new gr(this.typeBuilder,E(this.columnMetadata,{name:e}))}},es=class yr extends ct{index(e="btree"){return new yr(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new yr(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new yr(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new yr(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new yr(this.typeBuilder,E(this.columnMetadata,{name:e}))}},Kl=class sc extends ct{default(e){return new sc(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new sc(this.typeBuilder,E(this.columnMetadata,{name:e}))}},Xl=class ac extends ct{constructor(e){super(new rt(Me.Array(Me.U8)),e)}default(e){return new ac(E(this.columnMetadata,{defaultValue:e}))}name(e){return new ac(E(this.columnMetadata,{name:e}))}},jl=class oc extends ct{default(e){return new oc(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new oc(this.typeBuilder,E(this.columnMetadata,{name:e}))}},rx=class cd extends ct{constructor(e,t){super(e,t)}default(e){return new cd(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}},Yl=class cc extends ct{default(e){return new cc(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new cc(this.typeBuilder,E(this.columnMetadata,{name:e}))}},lc=class uc extends ct{default(e){return new uc(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new uc(this.typeBuilder,E(this.columnMetadata,{name:e}))}},$l=class dc extends lc{index(e="btree"){return new dc(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}primaryKey(){return new dc(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}},Zl=class hc extends ct{default(e){return new hc(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new hc(this.typeBuilder,E(this.columnMetadata,{name:e}))}},hr=class xr extends ct{index(e="btree"){return new xr(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new xr(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new xr(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new xr(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new xr(this.typeBuilder,E(this.columnMetadata,{name:e}))}},fr=class vr extends ct{index(e="btree"){return new vr(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new vr(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new vr(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new vr(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new vr(this.typeBuilder,E(this.columnMetadata,{name:e}))}},pr=class Sr extends ct{index(e="btree"){return new Sr(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new Sr(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new Sr(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new Sr(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new Sr(this.typeBuilder,E(this.columnMetadata,{name:e}))}},mr=class br extends ct{index(e="btree"){return new br(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new br(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new br(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new br(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new br(this.typeBuilder,E(this.columnMetadata,{name:e}))}},_r=class Mr extends ct{index(e="btree"){return new Mr(this.typeBuilder,E(this.columnMetadata,{indexType:e}))}unique(){return new Mr(this.typeBuilder,E(this.columnMetadata,{isUnique:!0}))}primaryKey(){return new Mr(this.typeBuilder,E(this.columnMetadata,{isPrimaryKey:!0}))}default(e){return new Mr(this.typeBuilder,E(this.columnMetadata,{defaultValue:e}))}name(e){return new Mr(this.typeBuilder,E(this.columnMetadata,{name:e}))}},sx=class extends rt{constructor(e){super(Me.Ref(e));le(this,"ref");le(this,"__spacetimeType");this.ref=e}},ax=((n,e)=>{let t=n,i;if(typeof n=="string"){if(!e)throw new TypeError("When providing a name, you must also provide the variants object or array.");t=e,i=n}if(Array.isArray(t)){const s={};for(const a of t)s[a]=new Rc;return new Zy(s,i)}return new Cc(t,i)}),r={bool:()=>new jy,string:()=>new Yy,number:()=>new Hl,i8:()=>new zy,u8:()=>new Ny,i16:()=>new Gy,u16:()=>new Fy,i32:()=>new Hy,u32:()=>new By,i64:()=>new Wy,u64:()=>new Oy,i128:()=>new qy,u128:()=>new ky,i256:()=>new Ky,u256:()=>new Vy,f32:()=>new Xy,f64:()=>new Hl,object:((n,e)=>{if(typeof n=="string"){if(!e)throw new TypeError("When providing a name, you must also provide the object.");return new Vr(e,n)}return new Vr(n,void 0)}),row:((n,e)=>{const[t,i]=typeof n=="string"?[e,n]:[n,void 0];return new An(t,i)}),array(n){return new tc(n)},enum:ax,unit(){return new Rc},lazy(n){let e=null;const t=()=>e??(e=n());return new Proxy({},{get(s,a,o){const c=t(),l=Reflect.get(c,a,o);return typeof l=="function"?l.bind(c):l},set(s,a,o,c){return Reflect.set(t(),a,o,c)},has(s,a){return a in t()},ownKeys(){return Reflect.ownKeys(t())},getOwnPropertyDescriptor(s,a){return Object.getOwnPropertyDescriptor(t(),a)},getPrototypeOf(){return Object.getPrototypeOf(t())}})},scheduleAt:()=>new Jy,option(n){return new la(n)},result(n,e){return new nc(n,e)},identity:()=>new Qy,connectionId:()=>new ex,timestamp:()=>new tx,timeDuration:()=>new nx,uuid:()=>new ix,byteArray:()=>new $y},ox=r.enum("RowSizeHint",{FixedSize:r.u16(),RowOffsets:r.array(r.u64())}),cx=ox,fc=r.object("BsatnRowList",{get sizeHint(){return cx},rowsData:r.byteArray()}),lx=r.object("CallReducer",{reducer:r.string(),args:r.byteArray(),requestId:r.u32(),flags:r.u8()}),ux=r.object("Subscribe",{queryStrings:r.array(r.string()),requestId:r.u32()}),dx=r.object("OneOffQuery",{messageId:r.byteArray(),queryString:r.string()}),ri=r.object("QueryId",{id:r.u32()}),hx=r.object("SubscribeSingle",{query:r.string(),requestId:r.u32(),get queryId(){return ri}}),fx=r.object("SubscribeMulti",{queryStrings:r.array(r.string()),requestId:r.u32(),get queryId(){return ri}}),px=r.object("Unsubscribe",{requestId:r.u32(),get queryId(){return ri}}),mx=r.object("UnsubscribeMulti",{requestId:r.u32(),get queryId(){return ri}}),_x=r.object("CallProcedure",{procedure:r.string(),args:r.byteArray(),requestId:r.u32(),flags:r.u8()}),gx=r.enum("ClientMessage",{get CallReducer(){return lx},get Subscribe(){return ux},get OneOffQuery(){return dx},get SubscribeSingle(){return hx},get SubscribeMulti(){return fx},get Unsubscribe(){return px},get UnsubscribeMulti(){return mx},get CallProcedure(){return _x}}),ts=gx,ld=r.object("QueryUpdate",{get deletes(){return fc},get inserts(){return fc}}),yx=r.enum("CompressableQueryUpdate",{get Uncompressed(){return ld},Brotli:r.byteArray(),Gzip:r.byteArray()}),xx=yx,ud=r.object("TableUpdate",{tableId:r.u32(),tableName:r.string(),numRows:r.u64(),get updates(){return r.array(xx)}}),Is=r.object("DatabaseUpdate",{get tables(){return r.array(ud)}}),vx=r.object("InitialSubscription",{get databaseUpdate(){return Is},requestId:r.u32(),totalHostExecutionDuration:r.timeDuration()}),Sx=r.enum("UpdateStatus",{get Committed(){return Is},Failed:r.string(),OutOfEnergy:r.unit()}),bx=Sx,Mx=r.object("ReducerCallInfo",{reducerName:r.string(),reducerId:r.u32(),args:r.byteArray(),requestId:r.u32()}),wx=r.object("EnergyQuanta",{quanta:r.u128()}),Ex=r.object("TransactionUpdate",{get status(){return bx},timestamp:r.timestamp(),callerIdentity:r.identity(),callerConnectionId:r.connectionId(),get reducerCall(){return Mx},get energyQuantaUsed(){return wx},totalHostExecutionDuration:r.timeDuration()}),Tx=r.object("TransactionUpdateLight",{requestId:r.u32(),get update(){return Is}}),Ax=r.object("IdentityToken",{identity:r.identity(),token:r.string(),connectionId:r.connectionId()}),Ix=r.object("OneOffTable",{tableName:r.string(),get rows(){return fc}}),Rx=r.object("OneOffQueryResponse",{messageId:r.byteArray(),error:r.option(r.string()),get tables(){return r.array(Ix)},totalHostExecutionDuration:r.timeDuration()}),dd=r.object("SubscribeRows",{tableId:r.u32(),tableName:r.string(),get tableRows(){return ud}}),Cx=r.object("SubscribeApplied",{requestId:r.u32(),totalHostExecutionDurationMicros:r.u64(),get queryId(){return ri},get rows(){return dd}}),Px=r.object("UnsubscribeApplied",{requestId:r.u32(),totalHostExecutionDurationMicros:r.u64(),get queryId(){return ri},get rows(){return dd}}),Ux=r.object("SubscriptionError",{totalHostExecutionDurationMicros:r.u64(),requestId:r.option(r.u32()),queryId:r.option(r.u32()),tableId:r.option(r.u32()),error:r.string()}),Dx=r.object("SubscribeMultiApplied",{requestId:r.u32(),totalHostExecutionDurationMicros:r.u64(),get queryId(){return ri},get update(){return Is}}),Lx=r.object("UnsubscribeMultiApplied",{requestId:r.u32(),totalHostExecutionDurationMicros:r.u64(),get queryId(){return ri},get update(){return Is}}),Nx=r.enum("ProcedureStatus",{Returned:r.byteArray(),OutOfEnergy:r.unit(),InternalError:r.string()}),Fx=Nx,Bx=r.object("ProcedureResult",{get status(){return Fx},timestamp:r.timestamp(),totalHostExecutionDuration:r.timeDuration(),requestId:r.u32()}),Ox=r.enum("ServerMessage",{get InitialSubscription(){return vx},get TransactionUpdate(){return Ex},get TransactionUpdateLight(){return Tx},get IdentityToken(){return Ax},get OneOffQueryResponse(){return Rx},get SubscribeApplied(){return Cx},get UnsubscribeApplied(){return Px},get SubscriptionError(){return Ux},get SubscribeMultiApplied(){return Dx},get UnsubscribeMultiApplied(){return Lx},get ProcedureResult(){return Bx}}),kx=Ox,Di,du,Sa=(du=class{constructor(){Ge(this,Di,new Map)}on(n,e){let t=R(this,Di).get(n);t||(t=new Set,R(this,Di).set(n,t)),t.add(e)}off(n,e){const t=R(this,Di).get(n);t&&t.delete(e)}emit(n,...e){const t=R(this,Di).get(n);if(t)for(const i of t)i(...e)}},Di=new WeakMap,du),Vx={component:"📦",info:"ℹ️",warn:"⚠️",error:"❌",debug:"🐛"},zx={component:"color: #fff; background-color: #8D6FDD; padding: 2px 5px; border-radius: 3px;",info:"color: #fff; background-color: #007bff; padding: 2px 5px; border-radius: 3px;",warn:"color: #fff; background-color: #ffc107; padding: 2px 5px; border-radius: 3px;",error:"color: #fff; background-color: #dc3545; padding: 2px 5px; border-radius: 3px;",debug:"color: #fff; background-color: #28a745; padding: 2px 5px; border-radius: 3px;"},Gx={component:"color: #8D6FDD;",info:"color: #007bff;",warn:"color: #ffc107;",error:"color: #dc3545;",debug:"color: #28a745;"},ni=(n,e)=>{console.log(`%c${Vx[n]} ${n.toUpperCase()}%c ${e}`,zx[n],Gx[n])},Jl=(n,e)=>n===e?0:n<e?-1:1,da,hd,hu,Hx=(hu=class{constructor(n){Ge(this,da);le(this,"rows");le(this,"tableDef");le(this,"emitter");le(this,"applyOperations",(n,e)=>{const t=[];if(Object.values(this.tableDef.columns).some(s=>s.columnMetadata.isPrimaryKey===!0)){const s=new Map,a=new Map;for(const o of n)if(o.type==="insert"){const[c,l]=s.get(o.rowId)||[o,0];s.set(o.rowId,[o,l+1])}else{const[c,l]=a.get(o.rowId)||[o,0];a.set(o.rowId,[o,l+1])}for(const[o,[c,l]]of s){const u=a.get(o);if(u){const[d,f]=u,p=l-f,m=this.update(e,o,c.row,p);m&&t.push(m),a.delete(o)}else{const d=this.insert(e,c,l);d&&t.push(d)}}for(const[o,c]of a.values()){const l=this.delete(e,o,c);l&&t.push(l)}}else for(const s of n)if(s.type==="insert"){const a=this.insert(e,s);a&&t.push(a)}else{const a=this.delete(e,s);a&&t.push(a)}return t});le(this,"update",(n,e,t,i=0)=>{const s=this.rows.get(e);if(!s){ni("error",`Updating a row that was not present in the cache. Table: ${this.tableDef.name}, RowId: ${e}`);return}const[a,o]=s,c=Math.max(1,o+i);if(o+i<=0){ni("error",`Negative reference count for in table ${this.tableDef.name} row ${e} (${o} + ${i})`);return}return this.rows.set(e,[t,c]),o===0?(ni("error",`Updating a row id in table ${this.tableDef.name} which was not present in the cache (rowId: ${e})`),{type:"insert",table:this.tableDef.name,cb:()=>{this.emitter.emit("insert",n,t)}}):{type:"update",table:this.tableDef.name,cb:()=>{this.emitter.emit("update",n,a,t)}}});le(this,"insert",(n,e,t=1)=>{const[i,s]=this.rows.get(e.rowId)||[e.row,0];if(this.rows.set(e.rowId,[e.row,s+t]),s===0)return{type:"insert",table:this.tableDef.name,cb:()=>{this.emitter.emit("insert",n,e.row)}}});le(this,"delete",(n,e,t=1)=>{const[i,s]=this.rows.get(e.rowId)||[e.row,0];if(s===0){ni("warn","Deleting a row that was not present in the cache");return}if(s<=t)return this.rows.delete(e.rowId),{type:"delete",table:this.tableDef.name,cb:()=>{this.emitter.emit("delete",n,e.row)}};this.rows.set(e.rowId,[e.row,s-t])});le(this,"onInsert",n=>{this.emitter.on("insert",n)});le(this,"onDelete",n=>{this.emitter.on("delete",n)});le(this,"onUpdate",n=>{this.emitter.on("update",n)});le(this,"removeOnInsert",n=>{this.emitter.off("insert",n)});le(this,"removeOnDelete",n=>{this.emitter.off("delete",n)});le(this,"removeOnUpdate",n=>{this.emitter.off("update",n)});this.tableDef=n,this.rows=new Map,this.emitter=new Sa;const e=this.tableDef.indexes||[];for(const t of e){const i=t,s=Ne(this,da,hd).call(this,this.tableDef,i);this[t.name]=s}}count(){return BigInt(this.rows.size)}iter(){function*n(e){for(const[t]of e.values())yield t}return n(this.rows)}[Symbol.iterator](){return this.iter()}},da=new WeakSet,hd=function(n,e){if(e.algorithm!=="btree")throw new Error("Only btree indexes are supported in TableCacheImpl");const t=e.columns,i=c=>t.map(l=>c[l]),s=(c,l)=>{const u=i(c),d=Array.isArray(l)?l:[l],f=Math.max(0,d.length-1);for(let y=0;y<f;y++)if(!rs(u[y],d[y]))return!1;const p=d[d.length-1],m=u[f];if(p&&typeof p=="object"&&"from"in p&&"to"in p){const y=p.from,v=p.to;if(y.tag!=="unbounded"){const _=Jl(m,y.value);if(_<0||_===0&&y.tag==="excluded")return!1}if(v.tag!=="unbounded"){const _=Jl(m,v.value);if(_>0||_===0&&v.tag==="excluded")return!1}return!0}else return!!rs(m,p)},a=n.constraints.some(c=>c.constraint!=="unique"?!1:rs(c.columns,e.columns)),o=this;return a?{find:l=>{const u=Array.isArray(l)?l:[l];for(const d of o.iter())if(rs(i(d),u))return d;return null}}:{*filter(l){for(const u of o.iter())s(u,l)&&(yield u)}}},hu),Wx=class{constructor(){le(this,"map",new Map)}get(n){return this.map.get(n)}set(n,e){return this.map.set(n,e),this}has(n){return this.map.has(n)}delete(n){return this.map.delete(n)}keys(){return this.map.keys()}values(){return this.map.values()}entries(){return this.map.entries()}[Symbol.iterator](){return this.entries()}},qx=class{constructor(){le(this,"tables",new Wx)}getTable(n){const e=this.tables.get(n);if(!e)throw console.error("The table has not been registered for this client. Please register the table before using it. If you have registered global tables using the SpacetimeDBClient.registerTables() or `registerTable()` method, please make sure that is executed first!"),new Error(`Table ${String(n)} does not exist`);return e}getOrCreateTable(n){const e=n.name,t=this.tables.get(e);if(t)return t;const i=new Hx(n);return this.tables.set(e,i),i}};function Kx(n,e){const t=Math.min(n.length,e.length);for(let i=0;i<t;i++){const s=n[i],a=e[i];if(s!==a)return typeof s=="number"&&typeof a=="number"?s-a:typeof s=="string"&&typeof a=="string"?s.localeCompare(a):typeof s=="string"?1:-1}return n.length-e.length}var fd=class pc{constructor(e,t,i,s=null,a=null){le(this,"major");le(this,"minor");le(this,"patch");le(this,"preRelease");le(this,"buildInfo");this.major=e,this.minor=t,this.patch=i,this.preRelease=s,this.buildInfo=a}toString(){let e=`${this.major}.${this.minor}.${this.patch}`;return this.preRelease&&(e+=`-${this.preRelease.join(".")}`),this.buildInfo&&(e+=`+${this.buildInfo}`),e}compare(e){return this.major!==e.major?this.major-e.major:this.minor!==e.minor?this.minor-e.minor:this.patch!==e.patch?this.patch-e.patch:this.preRelease&&e.preRelease?Kx(this.preRelease,e.preRelease):this.preRelease||e.preRelease?-1:0}clone(){return new pc(this.major,this.minor,this.patch,this.preRelease?[...this.preRelease]:null,this.buildInfo)}static parseVersionString(e){const t=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?$/,i=e.match(t);if(!i)throw new Error(`Invalid version string: ${e}`);const s=parseInt(i[1],10),a=parseInt(i[2],10),o=parseInt(i[3],10),c=i[4]?i[4].split(".").map(u=>isNaN(Number(u))?u:Number(u)):null,l=i[5]||null;return new pc(s,a,o,c,l)}},pd=new fd(1,4,0);function Xx(n){if(n===void 0)throw new Error(Ql(n));if(fd.parseVersionString(n).compare(pd)<0)throw new Error(Ql(n))}function Ql(n){return`Module code was generated with an incompatible version of the spacetimedb cli (${n}). Update the cli version to at least ${pd.toString()} and regenerate the bindings. You can upgrade to the latest cli version by running: spacetime version upgrade`}async function md(n,e,t=128*1024){let i=0;const s=new ReadableStream({pull(m){if(i<n.length){const y=n.subarray(i,Math.min(i+t,n.length));m.enqueue(y),i+=t}else m.close()}}),a=new DecompressionStream(e),c=s.pipeThrough(a).getReader(),l=[];let u=0,d;for(;!(d=await c.read()).done;)l.push(d.value),u+=d.value.length;const f=new Uint8Array(u);let p=0;for(const m of l)f.set(m,p),p+=m.length;return f}async function jx(){if(typeof globalThis.WebSocket<"u")return globalThis.WebSocket;const n=new Function("m","return import(m)");try{const{WebSocket:e}=await n("undici");return e}catch(e){throw console.warn("[spacetimedb-sdk] No global WebSocket found. On Node 18–21, please install `undici` (npm install undici) to enable WebSocket support."),e}}var Tr,In,_d,gd,yd,xd,Ar,Yx=(Ar=class{constructor(e){Ge(this,In);le(this,"onclose");le(this,"onopen");le(this,"onmessage");le(this,"onerror");Ge(this,Tr);this.onmessage=void 0,this.onopen=void 0,this.onmessage=void 0,this.onerror=void 0,e.onmessage=Ne(this,In,_d).bind(this),e.onerror=Ne(this,In,yd).bind(this),e.onclose=Ne(this,In,xd).bind(this),e.onopen=Ne(this,In,gd).bind(this),e.binaryType="arraybuffer",xe(this,Tr,e)}send(e){R(this,Tr).send(e)}close(){R(this,Tr).close()}static async createWebSocketFn({url:e,nameOrAddress:t,wsProtocol:i,authToken:s,compression:a,lightMode:o,confirmedReads:c}){const l=new Headers,u=await jx();let d;if(s){l.set("Authorization",`Bearer ${s}`);const m=new URL("v1/identity/websocket-token",e);m.protocol=e.protocol==="wss:"?"https:":"http:";const y=await fetch(m,{method:"POST",headers:l});if(y.ok){const{token:v}=await y.json();d=v}else return Promise.reject(new Error(`Failed to verify token: ${y.statusText}`))}const f=new URL(`v1/database/${t}/subscribe`,e);d&&f.searchParams.set("token",d),f.searchParams.set("compression",a==="gzip"?"Gzip":"None"),o&&f.searchParams.set("light","true"),c!==void 0&&f.searchParams.set("confirmed",c.toString());const p=new u(f.toString(),i);return new Ar(p)}},Tr=new WeakMap,In=new WeakSet,_d=async function(e){var s;const t=new Uint8Array(e.data);let i;if(t[0]===0)i=t.slice(1);else{if(t[0]===1)throw new Error("Brotli Compression not supported. Please use gzip or none compression in withCompression method on DbConnection.");if(t[0]===2)i=await md(t.slice(1),"gzip");else throw new Error("Unexpected Compression Algorithm. Please use `gzip` or `none`")}(s=this.onmessage)==null||s.call(this,{data:i})},gd=function(e){var t;(t=this.onopen)==null||t.call(this,e)},yd=function(e){var t;(t=this.onerror)==null||t.call(this,e)},xd=function(e){var t;(t=this.onclose)==null||t.call(this,e)},Ar),Ir,Rr,ha,ps,Li,ms,_s,gs,Cr,fu,$x=(fu=class{constructor(e,t){Ge(this,Ir);Ge(this,Rr);Ge(this,ha);Ge(this,ps);Ge(this,Li,new Sa);Ge(this,ms,"gzip");Ge(this,_s,!1);Ge(this,gs);Ge(this,Cr);this.remoteModule=e,this.dbConnectionCtor=t,xe(this,Cr,Yx.createWebSocketFn)}withUri(e){return xe(this,Ir,new URL(e)),this}withModuleName(e){return xe(this,Rr,e),this}withToken(e){return xe(this,ps,e),this}withWSFn(e){return xe(this,Cr,e),this}withCompression(e){return xe(this,ms,e),this}withLightMode(e){return xe(this,_s,e),this}withConfirmedReads(e){return xe(this,gs,e),this}onConnect(e){return R(this,Li).on("connect",e),this}onConnectError(e){return R(this,Li).on("connectError",e),this}onDisconnect(e){return R(this,Li).on("disconnect",e),this}build(){var e;if(!R(this,Ir))throw new Error("URI is required to connect to SpacetimeDB");if(!R(this,Rr))throw new Error("Database name or address is required to connect to SpacetimeDB");return Xx((e=this.remoteModule.versionInfo)==null?void 0:e.cliVersion),this.dbConnectionCtor({uri:R(this,Ir),nameOrAddress:R(this,Rr),identity:R(this,ha),token:R(this,ps),emitter:R(this,Li),compression:R(this,ms),lightMode:R(this,_s),confirmedReads:R(this,gs),createWSFn:R(this,Cr),remoteModule:this.remoteModule})}},Ir=new WeakMap,Rr=new WeakMap,ha=new WeakMap,ps=new WeakMap,Li=new WeakMap,ms=new WeakMap,_s=new WeakMap,gs=new WeakMap,Cr=new WeakMap,fu),ys,xs,pu,vd=(pu=class{constructor(n){Ge(this,ys);Ge(this,xs);this.db=n}onApplied(n){return xe(this,ys,n),this}onError(n){return xe(this,xs,n),this}subscribe(n){const e=Array.isArray(n)?n:[n];if(e.length===0)throw new Error("Subscriptions must have at least one query");const t=e.map(i=>{if(typeof i=="string")return i;if(Dy(i))return Ly(i);throw new Error("Subscriptions must be SQL strings or typed queries")});return new Jx(this.db,t,R(this,ys),R(this,xs))}subscribeToAllTables(){this.subscribe("SELECT * FROM *")}},ys=new WeakMap,xs=new WeakMap,pu),Zx=class{constructor(){le(this,"subscriptions",new Map)}},Pr,Ni,Jn,Qn,ei,mu,Jx=(mu=class{constructor(n,e,t,i){Ge(this,Pr);Ge(this,Ni,!1);Ge(this,Jn,!1);Ge(this,Qn,!1);Ge(this,ei,new Sa);this.db=n,R(this,ei).on("applied",s=>{xe(this,Qn,!0),t&&t(s)}),R(this,ei).on("error",(s,a)=>{xe(this,Qn,!1),xe(this,Jn,!0),i&&i(s,a)}),xe(this,Pr,this.db.registerSubscription(this,R(this,ei),e))}unsubscribe(){if(R(this,Ni))throw new Error("Unsubscribe has already been called");xe(this,Ni,!0),this.db.unregisterSubscription(R(this,Pr)),R(this,ei).on("end",n=>{xe(this,Jn,!0),xe(this,Qn,!1)})}unsubscribeThen(n){if(R(this,Jn))throw new Error("Subscription has already ended");if(R(this,Ni))throw new Error("Unsubscribe has already been called");xe(this,Ni,!0),this.db.unregisterSubscription(R(this,Pr)),R(this,ei).on("end",e=>{xe(this,Jn,!0),xe(this,Qn,!1),n(e)})}isEnded(){return R(this,Jn)}isActive(){return R(this,Qn)}},Pr=new WeakMap,Ni=new WeakMap,Jn=new WeakMap,Qn=new WeakMap,ei=new WeakMap,mu);function Qx(n){switch(n){case"FullUpdate":return 0;case"NoSuccessNotify":return 1}}var vs,fa,Ft,Ur,pa,Ss,gn,Fi,bs,Dr,ma,_a,$e,Sd,bd,Md,wd,$n,Ed,ss,Td,Ti,Ad,Id,_u,e0=(_u=class{constructor({uri:n,nameOrAddress:e,identity:t,token:i,emitter:s,remoteModule:a,createWSFn:o,compression:c,lightMode:l,confirmedReads:u}){Ge(this,$e);le(this,"isActive",!1);le(this,"identity");le(this,"token");le(this,"db");le(this,"reducers");le(this,"setReducerFlags");le(this,"procedures");le(this,"connectionId",ca.random());Ge(this,vs,0);Ge(this,fa,0);Ge(this,Ft);Ge(this,Ur,new Sa);Ge(this,pa);Ge(this,Ss,Promise.resolve());Ge(this,gn,new Zx);Ge(this,Fi);Ge(this,bs,new Map);Ge(this,Dr,new Map);le(this,"clientCache");le(this,"ws");le(this,"wsPromise");Ge(this,ma,()=>{const n=R(this,vs);return xe(this,vs,R(this,vs)+1),n});Ge(this,_a,()=>zc(this,fa)._++);le(this,"subscriptionBuilder",()=>new vd(this));ni("info","Connecting to SpacetimeDB WS...");const d=new URL(n.toString());/^wss?:/.test(n.protocol)||(d.protocol=d.protocol==="https:"?"wss:":"ws:"),this.identity=t,this.token=i,xe(this,Fi,a),xe(this,Ft,s);const f=this.connectionId.toHexString();d.searchParams.set("connection_id",f),this.clientCache=new qx,this.db=Ne(this,$e,Sd).call(this,a),this.reducers=Ne(this,$e,bd).call(this,a),this.setReducerFlags=Ne(this,$e,Md).call(this,a),this.procedures=Ne(this,$e,wd).call(this,a),this.wsPromise=o({url:d,nameOrAddress:e,wsProtocol:"v1.bsatn.spacetimedb",authToken:i,compression:c,lightMode:l,confirmedReads:u}).then(p=>(this.ws=p,this.ws.onclose=()=>{R(this,Ft).emit("disconnect",this),this.isActive=!1},this.ws.onerror=m=>{R(this,Ft).emit("connectError",this,m),this.isActive=!1},this.ws.onopen=Ne(this,$e,Td).bind(this),this.ws.onmessage=Ne(this,$e,Id).bind(this),p)).catch(p=>{ni("error","Error connecting to SpacetimeDB WS"),R(this,Ft).emit("connectError",this,p)})}registerSubscription(n,e,t){const i=R(this,ma).call(this);return R(this,gn).subscriptions.set(i,{handle:n,emitter:e}),Ne(this,$e,ss).call(this,ts.SubscribeMulti({queryStrings:t,queryId:{id:i},requestId:0})),i}unregisterSubscription(n){Ne(this,$e,ss).call(this,ts.UnsubscribeMulti({queryId:{id:n},requestId:0}))}callReducer(n,e,t){const i=ts.CallReducer({reducer:n,args:e,requestId:0,flags:Qx(t)});Ne(this,$e,ss).call(this,i)}callReducerWithParams(n,e,t,i){const s=new Bi(1024);Ui.serializeValue(s,e,t);const a=s.getBuffer();this.callReducer(n,a,i)}callProcedure(n,e){const{promise:t,resolve:i,reject:s}=Promise.withResolvers(),a=R(this,_a).call(this),o=ts.CallProcedure({procedure:n,args:e,requestId:a,flags:0});return Ne(this,$e,ss).call(this,o),R(this,Dr).set(a,c=>{c.tag==="Ok"?i(c.value):s(c.value)}),t}callProcedureWithParams(n,e,t,i){const s=new Bi(1024);Ui.serializeValue(s,e,t);const a=s.getBuffer();return this.callProcedure(n,a).then(o=>Me.deserializeValue(new Ri(o),i))}disconnect(){this.wsPromise.then(n=>{n&&n.close()})}on(n,e){R(this,Ft).on(n,e)}off(n,e){R(this,Ft).off(n,e)}onConnect(n){R(this,Ft).on("connect",n)}onDisconnect(n){R(this,Ft).on("disconnect",n)}onConnectError(n){R(this,Ft).on("connectError",n)}removeOnConnect(n){R(this,Ft).off("connect",n)}removeOnDisconnect(n){R(this,Ft).off("disconnect",n)}removeOnConnectError(n){R(this,Ft).off("connectError",n)}onReducer(n,e){R(this,Ur).on(n,e)}offReducer(n,e){R(this,Ur).off(n,e)}},vs=new WeakMap,fa=new WeakMap,Ft=new WeakMap,Ur=new WeakMap,pa=new WeakMap,Ss=new WeakMap,gn=new WeakMap,Fi=new WeakMap,bs=new WeakMap,Dr=new WeakMap,ma=new WeakMap,_a=new WeakMap,$e=new WeakSet,Sd=function(n){const e=Object.create(null);for(const t of n.tables){const i=t.accessorName;Object.defineProperty(e,i,{enumerable:!0,configurable:!1,get:()=>this.clientCache.getOrCreateTable(t)})}return e},bd=function(n){const e={};for(const t of n.reducers){const i=as(t.name);e[i]=o=>{const c=R(this,bs).get(t.name)??"FullUpdate";this.callReducerWithParams(t.name,t.paramsType,o,c)};const s=`on${fs(t.name)}`;e[s]=o=>{this.onReducer(t.name,o)};const a=`removeOn${fs(t.name)}`;e[a]=o=>{this.offReducer(t.name,o)}}return e},Md=function(n){const e=Object.create(null);for(const t of n.reducers){const i=as(t.name);Object.defineProperty(e,i,{enumerable:!0,configurable:!1,value:s=>{R(this,bs).set(t.name,s)}})}return e},wd=function(n){const e={};for(const t of n.procedures){const i=as(t.name),s=new Vr(t.params).algebraicType.value,a=t.returnType.algebraicType;e[i]=o=>this.callProcedureWithParams(t.name,s,o,a)}return e},$n=function(n){return{db:this.db,reducers:this.reducers,setReducerFlags:this.setReducerFlags,isActive:this.isActive,subscriptionBuilder:this.subscriptionBuilder.bind(this),disconnect:this.disconnect.bind(this),event:n}},Ed=async function(n){const e=(s,a,o)=>{const c=o.rowsData,l=new Ri(c),u=[],d=R(this,Fi).tables.find(v=>v.name===a),f=d.rowType,m=Object.entries(d.columns).find(v=>v[1].columnMetadata.isPrimaryKey);let y=0;for(;l.remaining>0;){const v=Ui.deserializeValue(l,f);let _;if(m!==void 0){const h=m[0],w=m[1].typeBuilder.algebraicType;_=Me.intoMapKey(w,v[h])}else{const h=c.subarray(y,l.offset);_=Ju.fromByteArray(h)}y=l.offset,u.push({type:s,rowId:_,row:v})}return u},t=async s=>{const a=s.tableName;let o=[];for(const c of s.updates){let l;if(c.tag==="Gzip"){const u=await md(c.value,"gzip");l=Me.deserializeValue(new Ri(u),ld.algebraicType)}else{if(c.tag==="Brotli")throw new Error("Brotli compression not supported. Please use gzip or none compression in withCompression method on DbConnection.");l=c.value}o=o.concat(e("insert",a,l.inserts)),o=o.concat(e("delete",a,l.deletes))}return{tableName:a,operations:o}},i=async s=>{const a=[];for(const o of s.tables)a.push(await t(o));return a};switch(n.tag){case"InitialSubscription":{const s=n.value.databaseUpdate;return{tag:"InitialSubscription",tableUpdates:await i(s)}}case"TransactionUpdateLight":{const s=n.value.update;return{tag:"TransactionUpdateLight",tableUpdates:await i(s)}}case"TransactionUpdate":{const s=n.value,a=s.callerIdentity,o=ca.nullIfZero(s.callerConnectionId),c=s.reducerCall.reducerName,l=s.reducerCall.args,u=s.energyQuantaUsed;let d=[],f="";switch(s.status.tag){case"Committed":d=await i(s.status.value);break;case"Failed":d=[],f=s.status.value;break;case"OutOfEnergy":d=[];break}if(c==="<none>"){console.error(`Received an error from the database: ${f}`);return}let p;return c!==""&&(p={reducerName:c,args:l}),{tag:"TransactionUpdate",tableUpdates:d,identity:a,connectionId:o,reducerInfo:p,status:s.status,energyConsumed:u.quanta,message:f,timestamp:s.timestamp}}case"IdentityToken":return{tag:"IdentityToken",identity:n.value.identity,token:n.value.token,connectionId:n.value.connectionId};case"OneOffQueryResponse":throw new Error(`TypeScript SDK never sends one-off queries, but got OneOffQueryResponse ${n}`);case"SubscribeMultiApplied":{const s=await i(n.value.update);return{tag:"SubscribeApplied",queryId:n.value.queryId.id,tableUpdates:s}}case"UnsubscribeMultiApplied":{const s=await i(n.value.update);return{tag:"UnsubscribeApplied",queryId:n.value.queryId.id,tableUpdates:s}}case"SubscriptionError":return{tag:"SubscriptionError",queryId:n.value.queryId,error:n.value.error};case"ProcedureResult":{const{status:s,requestId:a}=n.value;return{tag:"ProcedureResult",requestId:a,result:s.tag==="Returned"?{tag:"Ok",value:s.value}:s.tag==="OutOfEnergy"?{tag:"Err",value:"Procedure execution aborted due to insufficient energy"}:{tag:"Err",value:s.value}}}}},ss=function(n){this.wsPromise.then(e=>{if(e){const t=new Bi(1024);Me.serializeValue(t,ts.algebraicType,n);const i=t.getBuffer();e.send(i)}})},Td=function(){this.isActive=!0},Ti=function(n,e){const t=[];for(const i of n){const s=i.tableName,a=R(this,Fi).tables.find(l=>l.name===s),c=this.clientCache.getOrCreateTable(a).applyOperations(i.operations,e);for(const l of c)t.push(l)}return t},Ad=async function(n){var i,s;const e=Me.deserializeValue(new Ri(n),kx.algebraicType),t=await Ne(this,$e,Ed).call(this,e);if(t)switch(t.tag){case"InitialSubscription":{const a={tag:"SubscribeApplied"},o=Ne(this,$e,$n).call(this,a),{event:c,...l}=o,u=Ne(this,$e,Ti).call(this,t.tableUpdates,o);R(this,Ft)&&((i=R(this,pa))==null||i.call(this,l));for(const d of u)d.cb();break}case"TransactionUpdateLight":{const a={tag:"UnknownTransaction"},o=Ne(this,$e,$n).call(this,a),c=Ne(this,$e,Ti).call(this,t.tableUpdates,o);for(const l of c)l.cb();break}case"TransactionUpdate":{let a=t.reducerInfo;const o=a===void 0?void 0:R(this,Fi).reducers.find(y=>y.name===a.reducerName);let c,l=o===void 0;if(o)try{const y=new Ri(a.args);c=Ui.deserializeValue(y,o.paramsType)}catch{console.debug("Failed to deserialize reducer arguments"),l=!0}if(l){const y={tag:"UnknownTransaction"},v=Ne(this,$e,$n).call(this,y),_=Ne(this,$e,Ti).call(this,t.tableUpdates,v);for(const h of _)h.cb();return}a=a,c=c;const u={callerIdentity:t.identity,status:t.status,callerConnectionId:t.connectionId,timestamp:t.timestamp,energyConsumed:t.energyConsumed,reducer:{name:a.reducerName,args:c}},d={tag:"Reducer",value:u},f=Ne(this,$e,$n).call(this,d),p={...f,event:u},m=Ne(this,$e,Ti).call(this,t.tableUpdates,f);R(this,Ur).emit(a.reducerName,p,c);for(const y of m)y.cb();break}case"IdentityToken":{this.identity=t.identity,!this.token&&t.token&&(this.token=t.token),this.connectionId=t.connectionId,R(this,Ft).emit("connect",this,this.identity,this.token);break}case"SubscribeApplied":{const a=R(this,gn).subscriptions.get(t.queryId);if(a===void 0){ni("error",`Received SubscribeApplied for unknown queryId ${t.queryId}.`);break}const o={tag:"SubscribeApplied"},c=Ne(this,$e,$n).call(this,o),{event:l,...u}=c,d=Ne(this,$e,Ti).call(this,t.tableUpdates,c);a==null||a.emitter.emit("applied",u);for(const f of d)f.cb();break}case"UnsubscribeApplied":{const a=R(this,gn).subscriptions.get(t.queryId);if(a===void 0){ni("error",`Received UnsubscribeApplied for unknown queryId ${t.queryId}.`);break}const o={tag:"UnsubscribeApplied"},c=Ne(this,$e,$n).call(this,o),{event:l,...u}=c,d=Ne(this,$e,Ti).call(this,t.tableUpdates,c);a==null||a.emitter.emit("end",u),R(this,gn).subscriptions.delete(t.queryId);for(const f of d)f.cb();break}case"SubscriptionError":{const a=Error(t.error),o={tag:"Error",value:a},l={...Ne(this,$e,$n).call(this,o),event:a};t.queryId!==void 0?((s=R(this,gn).subscriptions.get(t.queryId))==null||s.emitter.emit("error",l,a),R(this,gn).subscriptions.delete(t.queryId)):(console.error("Received an error message without a queryId: ",a),R(this,gn).subscriptions.forEach(({emitter:u})=>{u.emit("error",l,a)}));break}case"ProcedureResult":{const{requestId:a,result:o}=t,c=R(this,Dr).get(a);R(this,Dr).delete(a),c==null||c(o);break}}},Id=function(n){xe(this,Ss,R(this,Ss).then(()=>Ne(this,$e,Ad).call(this,n.data)))},_u),t0=r.enum("Lifecycle",{Init:r.unit(),OnConnect:r.unit(),OnDisconnect:r.unit()}),Pc=t0;function ba(n,e,t,i){if(eu.has(n))throw new TypeError(`There is already a reducer with the name '${n}'`);eu.add(n),e instanceof An||(e=new An(e)),e.typeName===void 0&&(e.typeName=fs(n));const s=tn(e),a=Rd(nn.typespace,s).value;nn.reducers.push({name:n,params:a,lifecycle:i}),t.name||Object.defineProperty(t,"name",{value:n,writable:!1})}var eu=new Set;function tu(n,e,t){ba(n,e,t)}function n0(n,e,t){ba(n,e,t,Pc.Init)}function i0(n,e,t){ba(n,e,t,Pc.OnConnect)}function r0(n,e,t){ba(n,e,t,Pc.OnDisconnect)}var s0=class{constructor(n){le(this,"reducersType");this.reducersType=a0(n)}};function a0(n){return{reducers:n.map(i=>{const s=i.params.row;return{name:i.reducerName,accessorName:i.accessorName,params:s,paramsType:i.paramsSpacetimeType}})}}function o0(...n){const e=n.length===1&&Array.isArray(n[0])?n[0]:n;return new s0(e)}function Re(n,e){const t={elements:Object.entries(e).map(([i,s])=>({name:i,algebraicType:"typeBuilder"in s?s.typeBuilder.algebraicType:s.algebraicType}))};return{reducerName:n,accessorName:as(n),params:new An(e),paramsSpacetimeType:t,reducerDef:{name:n,params:t,lifecycle:void 0}}}function nu(n,e,t,i,s){const a=new An(t,fs(n.name));let o=tn(i).algebraicType;const{value:c}=Rd(nn.typespace,tn(a));if(nn.miscExports.push({tag:"View",value:{name:n.name,index:(e?ru:iu).length,isPublic:n.public,isAnonymous:e,params:c,returnType:o}}),o.tag=="Sum"){const l=s;s=((u,d)=>{const f=l(u,d);return f==null?[]:[f]}),o=Me.Array(o.value.variants[0].algebraicType)}(e?ru:iu).push({fn:s,params:c,returnType:o,returnTypeBaseSize:os(nn.typespace,o)})}var iu=[],ru=[];function su(n,e,t,i){const s={elements:Object.entries(e).map(([o,c])=>({name:o,algebraicType:tn("typeBuilder"in c?c.typeBuilder:c).algebraicType}))},a=tn(t).algebraicType;nn.miscExports.push({tag:"Procedure",value:{name:n,params:s,returnType:a}}),c0.push({fn:i,paramsType:s,returnType:a,returnTypeBaseSize:os(nn.typespace,a)})}var c0=[];function l0(...n){return{procedures:n.length===1&&Array.isArray(n[0])?n[0]:n}}function u0(n){return{tables:n.map(d0)}}function d0(n){const e=t=>n.rowType.algebraicType.value.elements[t].name;return{name:n.tableName,accessorName:as(n.tableName),columns:n.rowType.row,rowType:n.rowSpacetimeType,constraints:n.tableDef.constraints.map(t=>({name:t.name,constraint:"unique",columns:t.data.value.columns.map(e)})),indexes:n.tableDef.indexes.map(t=>{const i=t.algorithm.tag==="Direct"?[t.algorithm.value]:t.algorithm.value;return{name:t.accessorName,unique:n.tableDef.constraints.some(s=>s.data.value.columns.every(a=>i.includes(a))),algorithm:t.algorithm.tag.toLowerCase(),columns:i.map(e)}})}}var nn={typespace:{types:[]},tables:[],reducers:[],types:[],miscExports:[],rowLevelSecurity:[]},au=new Map;function Rd(n,e){let t=e.algebraicType;for(;t.tag==="Ref";)t=n.types[t.value];return t}function tn(n){return n instanceof Vr&&!f0(n)||n instanceof Cc||n instanceof An?h0(n):n instanceof la?new la(tn(n.value)):n instanceof nc?new nc(tn(n.ok),tn(n.err)):n instanceof tc?new tc(tn(n.element)):n}function h0(n){const e=n.algebraicType,t=n.typeName;if(t===void 0)throw new Error(`Missing type name for ${n.constructor.name??"TypeBuilder"} ${JSON.stringify(n)}`);let i=au.get(e);if(i!=null)return i;const s=n instanceof An||n instanceof Vr?{tag:"Product",value:{elements:[]}}:{tag:"Sum",value:{variants:[]}};if(i=new sx(nn.typespace.types.length),nn.typespace.types.push(s),au.set(e,i),n instanceof An)for(const[a,o]of Object.entries(n.row))s.value.elements.push({name:a,algebraicType:tn(o.typeBuilder).algebraicType});else if(n instanceof Vr)for(const[a,o]of Object.entries(n.elements))s.value.elements.push({name:a,algebraicType:tn(o).algebraicType});else if(n instanceof Cc)for(const[a,o]of Object.entries(n.variants))s.value.variants.push({name:a,algebraicType:tn(o).algebraicType});return nn.types.push({name:p0(t),ty:i.ref,customOrdering:!0}),i}function f0(n){return n.typeName==null&&n.algebraicType.value.elements.length===0}function p0(n){const e=n.split(".");return{name:e.pop(),scope:e}}var m0=class{constructor(n,e,t){le(this,"tablesDef");le(this,"typespace");le(this,"schemaType");le(this,"clientVisibilityFilter",{sql(n){nn.rowLevelSecurity.push({sql:n})}});this.tablesDef={tables:n},this.typespace=e,this.schemaType=u0(t)}reducer(n,e,t){return typeof e=="function"?(tu(n,{},e),e):(tu(n,e,t),t)}init(n,e){const[t,i]=typeof n=="string"?[n,e]:["init",n];n0(t,{},i)}clientConnected(n,e){const[t,i]=typeof n=="string"?[n,e]:["on_connect",n];i0(t,{},i)}clientDisconnected(n,e){const[t,i]=typeof n=="string"?[n,e]:["on_disconnect",n];r0(t,{},i)}view(n,e,t){nu(n,!1,{},e,t)}anonymousView(n,e,t){nu(n,!0,{},e,t)}procedure(n,e,t,i){return typeof t=="function"?(su(n,{},e,t),t):(su(n,e,t,i),i)}};function _0(...n){const e=n.length===1&&Array.isArray(n[0])?n[0]:n,t=e.map(i=>i.tableDef);return nn.tables.push(...t),e.map(i=>({name:i.tableName,accessorName:i.tableName,columns:i.rowType.row,rowType:i.rowSpacetimeType,indexes:i.idxs,constraints:i.constraints})),new m0(t,nn.typespace,e)}function Cd(n){return Object.fromEntries(n.map(e=>[e.accessorName,e]))}var g0=r.enum("RawIndexAlgorithm",{BTree:r.array(r.u16()),Hash:r.array(r.u16()),Direct:r.u16()}),ou=g0;function Z(n,e,...t){const{name:i,public:s=!1,indexes:a=[],scheduled:o}=n,c=new Map,l=[];e instanceof An||(e=new An(e)),e.typeName===void 0&&(e.typeName=fs(i));const u=tn(e);e.algebraicType.value.elements.forEach((h,w)=>{c.set(h.name,w),l.push(h.name)});const d=[],f=[],p=[],m=[];let y;for(const[h,w]of Object.entries(e.row)){const T=w.columnMetadata;T.isPrimaryKey&&d.push(c.get(h));const A=T.isUnique||T.isPrimaryKey;if(T.indexType||A){const I=T.indexType??"btree",P=c.get(h);let U;switch(I){case"btree":U=ou.BTree([P]);break;case"direct":U=ou.Direct(P);break}f.push({name:void 0,accessorName:h,algorithm:U})}if(A&&p.push({name:void 0,data:{tag:"Unique",value:{columns:[c.get(h)]}}}),T.isAutoIncrement&&m.push({name:void 0,start:void 0,minValue:void 0,maxValue:void 0,column:c.get(h),increment:1n}),o){const I=w.typeBuilder.algebraicType;ad.isScheduleAt(I)&&(y=c.get(h))}}for(const h of a??[]){let w;switch(h.algorithm){case"btree":w={tag:"BTree",value:h.columns.map(T=>c.get(T))};break;case"direct":w={tag:"Direct",value:c.get(h.column)};break}f.push({name:void 0,accessorName:h.name,algorithm:w})}for(const h of n.constraints??[])if(h.constraint==="unique"){const w={tag:"Unique",value:{columns:h.columns.map(T=>c.get(T))}};p.push({name:h.name,data:w});continue}for(const h of f){const T=(h.algorithm.tag==="Direct"?[h.algorithm.value]:h.algorithm.value).map(A=>l[A]).join("_");h.name=`${i}_${T}_idx_${h.algorithm.tag.toLowerCase()}`}const v={name:i,productTypeRef:u.ref,primaryKey:d,indexes:f,constraints:p,sequences:m,schedule:o&&y!==void 0?{name:void 0,reducerName:o,scheduledAtColumn:y}:void 0,tableType:{tag:"User"},tableAccess:{tag:s?"Public":"Private"}},_=e.algebraicType.value;return{rowType:e,tableName:i,rowSpacetimeType:_,tableDef:v,idxs:{},constraints:p}}const y0={displayName:r.string()},x0={requestId:r.string(),agentKind:r.u8(),regionId:r.u64(),payload:r.string()},v0={requestKey:r.string(),clientTsMs:r.u64()},S0={requestKey:r.string()},b0={requestId:r.string(),targetIdentity:r.identity(),clientTsMs:r.u64()},M0={buildingId:r.u64(),steps:r.u32()},w0={buildingId:r.u64()},E0={buildingId:r.u64(),regionId:r.u64(),hexX:r.i32(),hexZ:r.i32(),requiredItemDefId:r.u64(),requiredItemQty:r.u32(),buildRequired:r.u32()},T0={channelId:r.string(),body:r.string()},A0={claimId:r.u64(),radiusDelta:r.u32()},I0={claimId:r.u64(),totemBuildingId:r.u64(),radius:r.u32()},R0={paramKey:r.string(),intValue:r.i64(),floatValue:r.f64()},C0=r.object("EnvironmentEffectLoopTimer",{scheduledId:r.u64(),scheduledAt:r.scheduleAt(),lastRunAt:r.timestamp()}),P0={get arg(){return C0}},U0={guildId:r.string(),name:r.string()},D0={guildId:r.string()},L0={guildId:r.string(),projectId:r.string(),title:r.string(),progressPermille:r.u16()},N0={guildId:r.string(),memberIdentity:r.identity(),role:r.u8()},F0={housingEntityId:r.u64(),newEntranceBuildingEntityId:r.u64(),targetRegionIndex:r.u32(),movingMinutes:r.i32()},B0={housingEntityId:r.u64(),entranceBuildingEntityId:r.u64(),networkEntityId:r.u64(),dimensionEntityId:r.u64(),dimensionId:r.u32(),interiorInstanceId:r.u64()},O0={housingEntityId:r.u64(),portalX:r.f32(),portalY:r.f32(),portalZ:r.f32()},k0={housingEntityId:r.u64(),subjectIdentity:r.identity(),flags:r.u32()},V0={dataType:r.string()},z0={},G0=r.object("InteriorCollapseTimer",{scheduledId:r.u64(),scheduledAt:r.scheduleAt(),housingEntityId:r.u64()}),H0={get arg(){return G0}},W0={housingEntityId:r.u64(),isEmpty:r.bool(),respawnDelaySeconds:r.u32()},q0={},K0={containerId:r.u64(),fromSlotIndex:r.u32(),toSlotIndex:r.u32(),quantity:r.u32()},X0={containerId:r.u64(),reason:r.string()},j0={orderId:r.string()},Y0={buyOrderId:r.string(),sellOrderId:r.string(),quantity:r.u32()},$0={orderId:r.string(),side:r.u8(),itemDefId:r.u64(),quantity:r.u32(),unitPrice:r.u64()},Z0={targetIdentity:r.identity(),actionType:r.string(),reason:r.string(),durationMinutes:r.i32()},J0={requestId:r.string(),regionId:r.u64(),clientTsMs:r.u64(),x:r.f32(),y:r.f32(),z:r.f32()},Q0={npcId:r.u64(),requestId:r.string()},ev={npcId:r.u64(),requestId:r.string()},tv={npcId:r.u64(),requestId:r.string()},nv={partyId:r.string()},iv={partyId:r.string()},rv={partyId:r.string()},sv={partyId:r.string(),newLeaderIdentity:r.identity()},av=r.object("PlayerRegenLoopTimer",{scheduledId:r.u64(),scheduledAt:r.scheduleAt(),lastRunAt:r.timestamp()}),ov={get arg(){return av}},cv={chainId:r.u64()},lv={chainId:r.u64(),stageIndex:r.u32()},uv={housingEntityId:r.u64(),whiteList:r.array(r.identity())},dv={reportId:r.u64(),markValid:r.bool(),reason:r.string(),closeReport:r.bool()},hv={targetIdentity:r.identity(),reportType:r.string(),payload:r.string()},fv=r.object("ResourceRegenLoopTimer",{scheduledId:r.u64(),scheduledAt:r.scheduleAt(),lastRunAt:r.timestamp()}),pv={get arg(){return fv}},mv={targetIdentity:r.identity(),role:r.string()},_v={targetIdentity:r.identity(),role:r.string()},gv={},yv=r.object("SessionCleanupLoopTimer",{scheduledId:r.u64(),scheduledAt:r.scheduleAt(),lastRunAt:r.timestamp()}),xv={get arg(){return yv}},vv={regionId:r.u64()},Sv={},bv={},Mv={itemDefId:r.u64(),taxBps:r.u32()},wv={sessionId:r.string(),accepted:r.bool()},Ev={sessionId:r.string(),itemInstanceId:r.u64(),quantity:r.u32()},Tv={sessionId:r.string(),partnerIdentity:r.identity()},Av={containerId:r.u64()},Iv=r.row({identity:r.identity().primaryKey(),createdAt:r.timestamp().name("created_at"),status:r.u8()}),Rv=r.row({identity:r.identity().primaryKey(),displayName:r.string().name("display_name"),avatarId:r.u64().name("avatar_id"),locale:r.string(),updatedAt:r.timestamp().name("updated_at")}),Cv=r.row({achievementId:r.u64().primaryKey().name("achievement_id"),name:r.string(),criteriaType:r.u8().name("criteria_type"),criteriaTarget:r.u64().name("criteria_target"),criteriaCount:r.u32().name("criteria_count")}),Pv=r.row({achievementKey:r.string().primaryKey().name("achievement_key"),entityId:r.u64().name("entity_id"),achievementId:r.u64().name("achievement_id"),progress:r.u32(),completedAt:r.timestamp().name("completed_at")}),Uv=r.row({violationId:r.u64().primaryKey().name("violation_id"),identityHex:r.string().name("identity_hex"),actionType:r.string().name("action_type"),countInWindow:r.u32().name("count_in_window"),windowStartedAt:r.timestamp().name("window_started_at"),createdAt:r.timestamp().name("created_at")}),Dv=r.row({entityId:r.u64().primaryKey().name("entity_id"),actionType:r.string().name("action_type"),progressPermille:r.u16().name("progress_permille"),cooldownUntil:r.timestamp().name("cooldown_until")}),Lv=r.row({requestId:r.string().primaryKey().name("request_id"),agentKind:r.u8().name("agent_kind"),requestedBy:r.identity().name("requested_by"),regionId:r.u64().name("region_id"),status:r.u8(),payload:r.string(),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),Nv=r.row({resultId:r.string().primaryKey().name("result_id"),requestId:r.string().name("request_id"),status:r.u8(),summary:r.string(),createdAt:r.timestamp().name("created_at")}),Fv=r.row({eventId:r.u64().primaryKey().name("event_id"),identityHex:r.string().name("identity_hex"),actionType:r.string().name("action_type"),detail:r.string(),createdAt:r.timestamp().name("created_at")}),Bv=r.row({paramKey:r.string().primaryKey().name("param_key"),intValue:r.i64().name("int_value"),floatValue:r.f64().name("float_value"),updatedAt:r.timestamp().name("updated_at")}),Ov=r.row({outcomeId:r.string().primaryKey().name("outcome_id"),requestKey:r.string().name("request_key"),attackerIdentity:r.identity().name("attacker_identity"),targetIdentity:r.identity().name("target_identity"),regionId:r.u64().name("region_id"),damage:r.i32(),targetHpAfter:r.i32().name("target_hp_after"),hit:r.bool(),resolvedAt:r.timestamp().name("resolved_at")}),kv=r.row({requestKey:r.string().primaryKey().name("request_key"),attackerIdentity:r.identity().name("attacker_identity"),targetIdentity:r.identity().name("target_identity"),regionId:r.u64().name("region_id"),clientTsMs:r.u64().name("client_ts_ms"),impactDamage:r.i32().name("impact_damage"),phase:r.u8(),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),Vv=r.row({auditId:r.u64().primaryKey().name("audit_id"),actorIdentity:r.identity().name("actor_identity"),actionType:r.string().name("action_type"),payload:r.string(),createdAt:r.timestamp().name("created_at")}),zv=r.row({paramKey:r.string().primaryKey().name("param_key"),intValue:r.i64().name("int_value"),floatValue:r.f64().name("float_value"),updatedAt:r.timestamp().name("updated_at")}),Gv=r.row({identity:r.identity().primaryKey(),untilAt:r.timestamp().name("until_at"),reason:r.string(),updatedAt:r.timestamp().name("updated_at")}),Hv=r.row({buffKey:r.string().primaryKey().name("buff_key"),entityId:r.u64().name("entity_id"),buffId:r.u64().name("buff_id"),stack:r.u16(),expiresAt:r.timestamp().name("expires_at")}),Wv=r.row({buildingDefId:r.u64().primaryKey().name("building_def_id"),requiredItemDefId:r.u64().name("required_item_def_id"),requiredItemQty:r.u32().name("required_item_qty"),buildRequired:r.u32().name("build_required"),footprintRadius:r.u32().name("footprint_radius")}),qv=r.row({entityId:r.u64().primaryKey().name("entity_id"),ownerIdentity:r.identity().name("owner_identity"),regionId:r.u64().name("region_id"),hexX:r.i32().name("hex_x"),hexZ:r.i32().name("hex_z"),state:r.u8(),requiredItemDefId:r.u64().name("required_item_def_id"),requiredItemQty:r.u32().name("required_item_qty"),buildProgress:r.u32().name("build_progress"),buildRequired:r.u32().name("build_required"),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),Kv=r.row({entityId:r.u64().primaryKey().name("entity_id"),level:r.u32(),maxHp:r.u32().name("max_hp"),maxStamina:r.u32().name("max_stamina"),maxSatiation:r.u32().name("max_satiation")}),Xv=r.row({channelId:r.string().primaryKey().name("channel_id"),channelType:r.u8().name("channel_type"),scopeId:r.string().name("scope_id"),createdAt:r.timestamp().name("created_at")}),jv=r.row({messageId:r.string().primaryKey().name("message_id"),channelId:r.string().name("channel_id"),senderIdentity:r.identity().name("sender_identity"),body:r.string(),createdAt:r.timestamp().name("created_at")}),Yv=r.row({claimId:r.u64().primaryKey().name("claim_id"),ownerIdentity:r.identity().name("owner_identity"),totemBuildingId:r.u64().name("totem_building_id"),regionId:r.u64().name("region_id"),centerX:r.i32().name("center_x"),centerZ:r.i32().name("center_z"),radius:r.u32(),tier:r.u32(),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),$v=r.row({actionDefId:r.u64().primaryKey().name("action_def_id"),baseDamage:r.i32().name("base_damage"),cooldownMs:r.u32().name("cooldown_ms"),rangeMeters:r.u32().name("range_meters")}),Zv=r.row({identity:r.identity().primaryKey(),regionId:r.u64().name("region_id"),inCombat:r.bool().name("in_combat"),currentHp:r.i32().name("current_hp"),lastAttackClientTsMs:r.u64().name("last_attack_client_ts_ms"),updatedAt:r.timestamp().name("updated_at")}),Jv=r.row({txnId:r.u64().primaryKey().name("txn_id"),identity:r.identity(),amount:r.i64(),reason:r.string(),createdAt:r.timestamp().name("created_at")}),Qv=r.row({entityId:r.u64().primaryKey().name("entity_id"),dimensionId:r.u32().name("dimension_id"),networkEntityId:r.u64().name("network_entity_id"),interiorInstanceId:r.u64().name("interior_instance_id"),collapseTimestamp:r.timestamp().name("collapse_timestamp")}),eS=r.row({entityId:r.u64().primaryKey().name("entity_id"),buildingId:r.u64().name("building_id"),collapseRespawnTimestamp:r.timestamp().name("collapse_respawn_timestamp")}),tS=r.row({metricId:r.u64().primaryKey().name("metric_id"),metricKey:r.string().name("metric_key"),metricValue:r.f64().name("metric_value"),recordedAt:r.timestamp().name("recorded_at")}),nS=r.row({paramKey:r.string().primaryKey().name("param_key"),intValue:r.i64().name("int_value"),floatValue:r.f64().name("float_value"),updatedAt:r.timestamp().name("updated_at")}),iS=r.row({entityId:r.u64().primaryKey().name("entity_id"),entityType:r.u8().name("entity_type"),regionId:r.u64().name("region_id"),instanceId:r.u64().name("instance_id"),visibility:r.u8()}),rS=r.row({effectId:r.u64().primaryKey().name("effect_id"),name:r.string(),hazardBiomeId:r.u16().name("hazard_biome_id"),statusEffectId:r.u64().name("status_effect_id"),damagePerTick:r.u32().name("damage_per_tick"),exposurePerTick:r.i32().name("exposure_per_tick"),maxExposure:r.i32().name("max_exposure"),exposureDecayPerTick:r.i32().name("exposure_decay_per_tick"),resistanceLevelRequired:r.u32().name("resistance_level_required"),damageIntervalSeconds:r.u32().name("damage_interval_seconds"),enabled:r.bool()}),sS=r.row({exposureKey:r.string().primaryKey().name("exposure_key"),entityId:r.u64().name("entity_id"),effectId:r.u64().name("effect_id"),exposure:r.i32(),lastTickAt:r.timestamp().name("last_tick_at")}),aS=r.row({scheduledId:r.u64().primaryKey().name("scheduled_id"),scheduledAt:r.scheduleAt().name("scheduled_at"),lastRunAt:r.timestamp().name("last_run_at")}),oS=r.row({entityId:r.u64().primaryKey().name("entity_id"),lastBiomeId:r.u16().name("last_biome_id"),lastEvaluatedAt:r.timestamp().name("last_evaluated_at"),isSubmerged:r.bool().name("is_submerged")}),cS=r.row({escrowKey:r.string().primaryKey().name("escrow_key"),tradeSessionId:r.string().name("trade_session_id"),itemInstanceId:r.u64().name("item_instance_id"),quantity:r.u32(),ownerIdentity:r.identity().name("owner_identity"),createdAt:r.timestamp().name("created_at")}),lS=r.row({flagKey:r.string().primaryKey().name("flag_key"),enabled:r.bool(),updatedAt:r.timestamp().name("updated_at")}),uS=r.row({edgeKey:r.string().primaryKey().name("edge_key"),ownerIdentity:r.identity().name("owner_identity"),friendIdentity:r.identity().name("friend_identity"),status:r.u8(),updatedAt:r.timestamp().name("updated_at")}),dS=r.row({memberKey:r.string().primaryKey().name("member_key"),guildId:r.string().name("guild_id"),memberIdentity:r.identity().name("member_identity"),role:r.u8(),joinedAt:r.timestamp().name("joined_at")}),hS=r.row({projectId:r.string().primaryKey().name("project_id"),guildId:r.string().name("guild_id"),title:r.string(),progressPermille:r.u16().name("progress_permille"),updatedAt:r.timestamp().name("updated_at")}),fS=r.row({guildId:r.string().primaryKey().name("guild_id"),name:r.string(),founderIdentity:r.identity().name("founder_identity"),createdAt:r.timestamp().name("created_at")}),pS=r.row({entityId:r.u64().primaryKey().name("entity_id"),ownerIdentity:r.identity().name("owner_identity"),entranceBuildingEntityId:r.u64().name("entrance_building_entity_id"),exitPortalEntityId:r.u64().name("exit_portal_entity_id"),networkEntityId:r.u64().name("network_entity_id"),regionIndex:r.u32().name("region_index"),lockedUntil:r.timestamp().name("locked_until"),isEmpty:r.bool().name("is_empty")}),mS=r.row({instanceId:r.u64().primaryKey().name("instance_id"),regionId:r.u64().name("region_id"),instanceType:r.u8().name("instance_type"),ttlSeconds:r.u32().name("ttl_seconds")}),_S=r.row({scheduledId:r.u64().primaryKey().name("scheduled_id"),scheduledAt:r.scheduleAt().name("scheduled_at"),housingEntityId:r.u64().name("housing_entity_id")}),gS=r.row({containerId:r.u64().primaryKey().name("container_id"),ownerIdentity:r.identity().name("owner_identity"),inventoryIndex:r.i32().name("inventory_index"),cargoIndex:r.i32().name("cargo_index"),slotCount:r.u32().name("slot_count"),itemPocketVolume:r.i32().name("item_pocket_volume"),cargoPocketVolume:r.i32().name("cargo_pocket_volume")}),yS=r.row({containerId:r.u64().primaryKey().name("container_id"),lockReason:r.string().name("lock_reason"),lockedBy:r.identity().name("locked_by"),expiresAt:r.timestamp().name("expires_at")}),xS=r.row({slotKey:r.string().primaryKey().name("slot_key"),containerId:r.u64().name("container_id"),slotIndex:r.u32().name("slot_index"),itemInstanceId:r.u64().name("item_instance_id"),volume:r.i32(),locked:r.bool(),itemType:r.u8().name("item_type")}),vS=r.row({itemDefId:r.u64().primaryKey().name("item_def_id"),category:r.u8(),rarity:r.u8(),maxStack:r.u32().name("max_stack"),volume:r.i32()}),SS=r.row({itemInstanceId:r.u64().primaryKey().name("item_instance_id"),itemDefId:r.u64().name("item_def_id"),itemType:r.u8().name("item_type"),durability:r.i32(),bound:r.bool()}),bS=r.row({itemInstanceId:r.u64().primaryKey().name("item_instance_id"),quantity:r.u32()}),MS=r.row({knowledgeKey:r.string().primaryKey().name("knowledge_key"),entityId:r.u64().name("entity_id"),knowledgeId:r.u64().name("knowledge_id"),status:r.u8(),updatedAt:r.timestamp().name("updated_at")}),wS=r.row({paramKey:r.string().primaryKey().name("param_key"),intValue:r.i64().name("int_value"),floatValue:r.f64().name("float_value"),updatedAt:r.timestamp().name("updated_at")}),ES=r.row({fillId:r.string().primaryKey().name("fill_id"),buyOrderId:r.string().name("buy_order_id"),sellOrderId:r.string().name("sell_order_id"),itemDefId:r.u64().name("item_def_id"),quantity:r.u32(),unitPrice:r.u64().name("unit_price"),buyerIdentity:r.identity().name("buyer_identity"),sellerIdentity:r.identity().name("seller_identity"),createdAt:r.timestamp().name("created_at")}),TS=r.row({orderId:r.string().primaryKey().name("order_id"),ownerIdentity:r.identity().name("owner_identity"),regionId:r.u64().name("region_id"),side:r.u8(),itemDefId:r.u64().name("item_def_id"),quantityOpen:r.u32().name("quantity_open"),unitPrice:r.u64().name("unit_price"),status:r.u8(),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),AS=r.row({metricDayKey:r.string().primaryKey().name("metric_day_key"),metricKey:r.string().name("metric_key"),metricValue:r.f64().name("metric_value"),recordedAt:r.timestamp().name("recorded_at")}),IS=r.row({actionId:r.u64().primaryKey().name("action_id"),targetIdentity:r.identity().name("target_identity"),actionType:r.string().name("action_type"),reason:r.string(),actorIdentity:r.identity().name("actor_identity"),createdAt:r.timestamp().name("created_at")}),RS=r.row({identity:r.identity().primaryKey(),score:r.i32(),lastReason:r.string().name("last_reason"),updatedAt:r.timestamp().name("updated_at")}),CS=r.row({identity:r.identity().primaryKey(),regionId:r.u64().name("region_id"),lastClientTsMs:r.u64().name("last_client_ts_ms"),lastRequestId:r.string().name("last_request_id"),lastPosition:r.array(r.f32()).name("last_position"),updatedAt:r.timestamp().name("updated_at")}),PS=r.row({requestKey:r.string().primaryKey().name("request_key"),identity:r.identity(),requestId:r.string().name("request_id"),regionId:r.u64().name("region_id"),clientTsMs:r.u64().name("client_ts_ms"),accepted:r.bool(),processedAt:r.timestamp().name("processed_at")}),US=r.row({violationId:r.string().primaryKey().name("violation_id"),identity:r.identity(),reason:r.string(),ts:r.timestamp(),attemptedPosition:r.array(r.f32()).name("attempted_position")}),DS=r.row({requestId:r.string().primaryKey().name("request_id"),npcId:r.u64().name("npc_id"),actionKind:r.u8().name("action_kind"),status:r.u8(),payload:r.string(),createdAt:r.timestamp().name("created_at")}),LS=r.row({resultId:r.string().primaryKey().name("result_id"),requestId:r.string().name("request_id"),status:r.u8(),summary:r.string(),createdAt:r.timestamp().name("created_at")}),NS=r.row({scheduleId:r.string().primaryKey().name("schedule_id"),npcId:r.u64().name("npc_id"),actionKind:r.u8().name("action_kind"),scheduledAt:r.timestamp().name("scheduled_at")}),FS=r.row({sessionId:r.string().primaryKey().name("session_id"),npcId:r.u64().name("npc_id"),playerIdentity:r.identity().name("player_identity"),status:r.u8(),lastAt:r.timestamp().name("last_at")}),BS=r.row({turnKey:r.string().primaryKey().name("turn_key"),sessionId:r.string().name("session_id"),turnIndex:r.u32().name("turn_index"),inputSummary:r.string().name("input_summary"),outputSummary:r.string().name("output_summary")}),OS=r.row({metricId:r.u64().primaryKey().name("metric_id"),npcId:r.u64().name("npc_id"),tokenIn:r.u32().name("token_in"),tokenOut:r.u32().name("token_out"),costMicrounits:r.u64().name("cost_microunits"),createdAt:r.timestamp().name("created_at")}),kS=r.row({interactionKey:r.string().primaryKey().name("interaction_key"),npcId:r.u64().name("npc_id"),callerIdentity:r.identity().name("caller_identity"),interactionKind:r.u8().name("interaction_kind"),status:r.u8(),detail:r.string(),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),VS=r.row({npcId:r.u64().primaryKey().name("npc_id"),summary:r.string(),updatedAt:r.timestamp().name("updated_at")}),zS=r.row({npcId:r.u64().primaryKey().name("npc_id"),summary:r.string(),updatedAt:r.timestamp().name("updated_at")}),GS=r.row({violationId:r.u64().primaryKey().name("violation_id"),npcId:r.u64().name("npc_id"),playerIdentity:r.identity().name("player_identity"),reason:r.string(),severity:r.u8(),createdAt:r.timestamp().name("created_at")}),HS=r.row({relationKey:r.string().primaryKey().name("relation_key"),npcId:r.u64().name("npc_id"),playerIdentity:r.identity().name("player_identity"),affinity:r.i32(),trust:r.i32(),updatedAt:r.timestamp().name("updated_at")}),WS=r.row({cacheKey:r.string().primaryKey().name("cache_key"),npcId:r.u64().name("npc_id"),promptHash:r.string().name("prompt_hash"),responseSummary:r.string().name("response_summary"),updatedAt:r.timestamp().name("updated_at")}),qS=r.row({npcId:r.u64().primaryKey().name("npc_id"),regionId:r.u64().name("region_id"),posX:r.f32().name("pos_x"),posZ:r.f32().name("pos_z"),scheduleKind:r.u8().name("schedule_kind"),updatedAt:r.timestamp().name("updated_at")}),KS=r.row({fillId:r.u64().primaryKey().name("fill_id"),orderId:r.string().name("order_id"),fillQty:r.u32().name("fill_qty"),fillPrice:r.u64().name("fill_price"),createdAt:r.timestamp().name("created_at")}),XS=r.row({changeId:r.u64().primaryKey().name("change_id"),paramKey:r.string().name("param_key"),beforeInt:r.i64().name("before_int"),afterInt:r.i64().name("after_int"),beforeFloat:r.f64().name("before_float"),afterFloat:r.f64().name("after_float"),changedAt:r.timestamp().name("changed_at")}),jS=r.row({guardrailKey:r.string().primaryKey().name("guardrail_key"),minInt:r.i64().name("min_int"),maxInt:r.i64().name("max_int"),minFloat:r.f64().name("min_float"),maxFloat:r.f64().name("max_float")}),YS=r.row({memberKey:r.string().primaryKey().name("member_key"),partyId:r.string().name("party_id"),memberIdentity:r.identity().name("member_identity"),role:r.u8(),joinedAt:r.timestamp().name("joined_at")}),$S=r.row({partyId:r.string().primaryKey().name("party_id"),leaderIdentity:r.identity().name("leader_identity"),regionId:r.u64().name("region_id"),createdAt:r.timestamp().name("created_at")}),ZS=r.row({permissionKey:r.string().primaryKey().name("permission_key"),targetKind:r.u8().name("target_kind"),targetId:r.u64().name("target_id"),subjectIdentity:r.identity().name("subject_identity"),flags:r.u32()}),JS=r.row({viewKey:r.string().primaryKey().name("view_key"),ownerIdentity:r.identity().name("owner_identity"),containerId:r.u64().name("container_id"),slotCount:r.u32().name("slot_count"),itemPocketVolume:r.i32().name("item_pocket_volume"),cargoPocketVolume:r.i32().name("cargo_pocket_volume")}),QS=r.row({itemInstanceId:r.u64().primaryKey().name("item_instance_id"),ownerIdentity:r.identity().name("owner_identity"),containerId:r.u64().name("container_id"),slotIndex:r.u32().name("slot_index"),itemDefId:r.u64().name("item_def_id"),quantity:r.u32(),durability:r.i32(),bound:r.bool()}),eb=r.row({slotKey:r.string().primaryKey().name("slot_key"),ownerIdentity:r.identity().name("owner_identity"),containerId:r.u64().name("container_id"),slotIndex:r.u32().name("slot_index"),itemInstanceId:r.u64().name("item_instance_id"),locked:r.bool(),itemType:r.u8().name("item_type"),volume:r.i32()}),tb=r.row({requestKey:r.string().primaryKey().name("request_key"),identity:r.identity(),requestId:r.string().name("request_id"),accepted:r.bool(),reasonCode:r.string().name("reason_code"),serverPos:r.array(r.f32()).name("server_pos"),processedAt:r.timestamp().name("processed_at")}),nb=r.row({scheduledId:r.u64().primaryKey().name("scheduled_id"),scheduledAt:r.scheduleAt().name("scheduled_at"),lastRunAt:r.timestamp().name("last_run_at")}),ib=r.row({identity:r.identity().primaryKey(),regionId:r.u64().name("region_id"),lastActiveAt:r.timestamp().name("last_active_at")}),rb=r.row({playerId:r.identity().primaryKey().name("player_id"),displayName:r.string().name("display_name"),createdAt:r.timestamp().name("created_at")}),sb=r.row({identity:r.identity().primaryKey(),balance:r.i64(),updatedAt:r.timestamp().name("updated_at")}),ab=r.row({indexKey:r.string().primaryKey().name("index_key"),itemDefId:r.u64().name("item_def_id"),priceAvg:r.u64().name("price_avg"),volume:r.u64(),recordedAt:r.timestamp().name("recorded_at")}),ob=r.row({chainId:r.u64().primaryKey().name("chain_id"),startNpcId:r.u64().name("start_npc_id"),stageCount:r.u32().name("stage_count"),rewardItemDefId:r.u64().name("reward_item_def_id"),rewardItemQty:r.u32().name("reward_item_qty")}),cb=r.row({chainKey:r.string().primaryKey().name("chain_key"),identity:r.identity(),chainId:r.u64().name("chain_id"),status:r.u8(),startedAt:r.timestamp().name("started_at"),updatedAt:r.timestamp().name("updated_at")}),lb=r.row({stageId:r.u64().primaryKey().name("stage_id"),chainId:r.u64().name("chain_id"),objectiveType:r.u8().name("objective_type"),objectiveTarget:r.u64().name("objective_target"),objectiveCount:r.u32().name("objective_count")}),ub=r.row({stageKey:r.string().primaryKey().name("stage_key"),chainKey:r.string().name("chain_key"),stageIndex:r.u32().name("stage_index"),status:r.u8(),updatedAt:r.timestamp().name("updated_at")}),db=r.row({questKey:r.string().primaryKey().name("quest_key"),entityId:r.u64().name("entity_id"),chainId:r.u64().name("chain_id"),stageId:r.u64().name("stage_id"),status:r.u8(),updatedAt:r.timestamp().name("updated_at")}),hb=r.row({bucketKey:r.string().primaryKey().name("bucket_key"),identity:r.identity(),actionType:r.string().name("action_type"),countInWindow:r.u32().name("count_in_window"),windowStartedAt:r.timestamp().name("window_started_at")}),fb=r.row({regionId:r.u64().primaryKey().name("region_id"),name:r.string(),status:r.u8(),shardLoadPermille:r.u16().name("shard_load_permille")}),pb=r.row({entityId:r.u64().primaryKey().name("entity_id"),whiteList:r.array(r.identity()).name("white_list")}),mb=r.row({reportId:r.u64().primaryKey().name("report_id"),reporterIdentity:r.identity().name("reporter_identity"),targetIdentity:r.identity().name("target_identity"),reportType:r.string().name("report_type"),payload:r.string(),createdAt:r.timestamp().name("created_at")}),_b=r.row({entityId:r.u64().primaryKey().name("entity_id"),resourceType:r.u8().name("resource_type"),amount:r.u32(),respawnAt:r.timestamp().name("respawn_at")}),gb=r.row({scheduledId:r.u64().primaryKey().name("scheduled_id"),scheduledAt:r.scheduleAt().name("scheduled_at"),lastRunAt:r.timestamp().name("last_run_at")}),yb=r.row({entityId:r.u64().primaryKey().name("entity_id"),hp:r.u32(),stamina:r.u32(),satiation:r.u32(),lastDamageAt:r.timestamp().name("last_damage_at"),lastStaminaUseAt:r.timestamp().name("last_stamina_use_at"),lastRegenAt:r.timestamp().name("last_regen_at")}),xb=r.row({bindingId:r.string().primaryKey().name("binding_id"),identity:r.identity(),role:r.string(),grantedAt:r.timestamp().name("granted_at"),grantedBy:r.identity().name("granted_by")}),vb=r.row({scheduledId:r.u64().primaryKey().name("scheduled_id"),scheduledAt:r.scheduleAt().name("scheduled_at"),lastRunAt:r.timestamp().name("last_run_at")}),Sb=r.row({identity:r.identity().primaryKey(),regionId:r.u64().name("region_id"),lastActiveAt:r.timestamp().name("last_active_at")}),bb=r.row({skillKey:r.string().primaryKey().name("skill_key"),entityId:r.u64().name("entity_id"),skillId:r.u64().name("skill_id"),xp:r.u64(),level:r.u32(),updatedAt:r.timestamp().name("updated_at")}),Mb=r.row({feedId:r.u64().primaryKey().name("feed_id"),identityHex:r.string().name("identity_hex"),feedType:r.string().name("feed_type"),payload:r.string(),createdAt:r.timestamp().name("created_at")}),wb=r.row({statusKey:r.string().primaryKey().name("status_key"),entityId:r.u64().name("entity_id"),effectId:r.u64().name("effect_id"),stack:r.u16(),expiresAt:r.timestamp().name("expires_at")}),Eb=r.row({itemDefId:r.u64().primaryKey().name("item_def_id"),taxBps:r.u32().name("tax_bps"),updatedAt:r.timestamp().name("updated_at")}),Tb=r.row({chunkKey:r.string().primaryKey().name("chunk_key"),regionId:r.u64().name("region_id"),chunkX:r.i32().name("chunk_x"),chunkY:r.i32().name("chunk_y"),biomeId:r.u16().name("biome_id"),seed:r.u64()}),Ab=r.row({threatKey:r.string().primaryKey().name("threat_key"),attackerIdentity:r.identity().name("attacker_identity"),targetIdentity:r.identity().name("target_identity"),threat:r.i32(),updatedAt:r.timestamp().name("updated_at")}),Ib=r.row({offerKey:r.string().primaryKey().name("offer_key"),sessionId:r.string().name("session_id"),ownerIdentity:r.identity().name("owner_identity"),itemInstanceId:r.u64().name("item_instance_id"),quantity:r.u32(),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),Rb=r.row({sessionId:r.string().primaryKey().name("session_id"),initiatorIdentity:r.identity().name("initiator_identity"),partnerIdentity:r.identity().name("partner_identity"),regionId:r.u64().name("region_id"),phase:r.u8(),initiatorAccepted:r.bool().name("initiator_accepted"),partnerAccepted:r.bool().name("partner_accepted"),createdAt:r.timestamp().name("created_at"),updatedAt:r.timestamp().name("updated_at")}),Cb=r.row({entityId:r.identity().primaryKey().name("entity_id"),regionId:r.u64().name("region_id"),position:r.array(r.f32()),rotation:r.array(r.f32()),updatedAt:r.timestamp().name("updated_at")}),Pb=r.row({identity:r.identity().primaryKey(),balance:r.i64(),updatedAt:r.timestamp().name("updated_at")});r.object("Account",{identity:r.identity(),createdAt:r.timestamp(),status:r.u8()});r.object("AccountProfile",{identity:r.identity(),displayName:r.string(),avatarId:r.u64(),locale:r.string(),updatedAt:r.timestamp()});r.object("AchievementDef",{achievementId:r.u64(),name:r.string(),criteriaType:r.u8(),criteriaTarget:r.u64(),criteriaCount:r.u32()});r.object("AchievementState",{achievementKey:r.string(),entityId:r.u64(),achievementId:r.u64(),progress:r.u32(),completedAt:r.timestamp()});r.object("ActionRateViolation",{violationId:r.u64(),identityHex:r.string(),actionType:r.string(),countInWindow:r.u32(),windowStartedAt:r.timestamp(),createdAt:r.timestamp()});r.object("ActionState",{entityId:r.u64(),actionType:r.string(),progressPermille:r.u16(),cooldownUntil:r.timestamp()});r.object("AgentRequest",{requestId:r.string(),agentKind:r.u8(),requestedBy:r.identity(),regionId:r.u64(),status:r.u8(),payload:r.string(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("AgentResult",{resultId:r.string(),requestId:r.string(),status:r.u8(),summary:r.string(),createdAt:r.timestamp()});r.object("AntiCheatEvent",{eventId:r.u64(),identityHex:r.string(),actionType:r.string(),detail:r.string(),createdAt:r.timestamp()});r.object("AntiCheatParams",{paramKey:r.string(),intValue:r.i64(),floatValue:r.f64(),updatedAt:r.timestamp()});r.object("AttackOutcome",{outcomeId:r.string(),requestKey:r.string(),attackerIdentity:r.identity(),targetIdentity:r.identity(),regionId:r.u64(),damage:r.i32(),targetHpAfter:r.i32(),hit:r.bool(),resolvedAt:r.timestamp()});r.object("AttackScheduled",{requestKey:r.string(),attackerIdentity:r.identity(),targetIdentity:r.identity(),regionId:r.u64(),clientTsMs:r.u64(),impactDamage:r.i32(),phase:r.u8(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("AuditLog",{auditId:r.u64(),actorIdentity:r.identity(),actionType:r.string(),payload:r.string(),createdAt:r.timestamp()});r.object("BalanceParams",{paramKey:r.string(),intValue:r.i64(),floatValue:r.f64(),updatedAt:r.timestamp()});r.object("BanList",{identity:r.identity(),untilAt:r.timestamp(),reason:r.string(),updatedAt:r.timestamp()});r.object("BuffState",{buffKey:r.string(),entityId:r.u64(),buffId:r.u64(),stack:r.u16(),expiresAt:r.timestamp()});r.object("BuildingDef",{buildingDefId:r.u64(),requiredItemDefId:r.u64(),requiredItemQty:r.u32(),buildRequired:r.u32(),footprintRadius:r.u32()});r.object("BuildingState",{entityId:r.u64(),ownerIdentity:r.identity(),regionId:r.u64(),hexX:r.i32(),hexZ:r.i32(),state:r.u8(),requiredItemDefId:r.u64(),requiredItemQty:r.u32(),buildProgress:r.u32(),buildRequired:r.u32(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("CharacterStats",{entityId:r.u64(),level:r.u32(),maxHp:r.u32(),maxStamina:r.u32(),maxSatiation:r.u32()});r.object("ChatChannel",{channelId:r.string(),channelType:r.u8(),scopeId:r.string(),createdAt:r.timestamp()});r.object("ChatMessage",{messageId:r.string(),channelId:r.string(),senderIdentity:r.identity(),body:r.string(),createdAt:r.timestamp()});r.object("ClaimState",{claimId:r.u64(),ownerIdentity:r.identity(),totemBuildingId:r.u64(),regionId:r.u64(),centerX:r.i32(),centerZ:r.i32(),radius:r.u32(),tier:r.u32(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("CombatActionDef",{actionDefId:r.u64(),baseDamage:r.i32(),cooldownMs:r.u32(),rangeMeters:r.u32()});r.object("CombatState",{identity:r.identity(),regionId:r.u64(),inCombat:r.bool(),currentHp:r.i32(),lastAttackClientTsMs:r.u64(),updatedAt:r.timestamp()});r.object("CurrencyTxn",{txnId:r.u64(),identity:r.identity(),amount:r.i64(),reason:r.string(),createdAt:r.timestamp()});r.object("DimensionDesc",{entityId:r.u64(),dimensionId:r.u32(),networkEntityId:r.u64(),interiorInstanceId:r.u64(),collapseTimestamp:r.timestamp()});r.object("DimensionNetwork",{entityId:r.u64(),buildingId:r.u64(),collapseRespawnTimestamp:r.timestamp()});r.object("EconomyMetric",{metricId:r.u64(),metricKey:r.string(),metricValue:r.f64(),recordedAt:r.timestamp()});r.object("EconomyParams",{paramKey:r.string(),intValue:r.i64(),floatValue:r.f64(),updatedAt:r.timestamp()});r.object("EntityCore",{entityId:r.u64(),entityType:r.u8(),regionId:r.u64(),instanceId:r.u64(),visibility:r.u8()});r.object("EnvironmentEffectDesc",{effectId:r.u64(),name:r.string(),hazardBiomeId:r.u16(),statusEffectId:r.u64(),damagePerTick:r.u32(),exposurePerTick:r.i32(),maxExposure:r.i32(),exposureDecayPerTick:r.i32(),resistanceLevelRequired:r.u32(),damageIntervalSeconds:r.u32(),enabled:r.bool()});r.object("EnvironmentEffectExposure",{exposureKey:r.string(),entityId:r.u64(),effectId:r.u64(),exposure:r.i32(),lastTickAt:r.timestamp()});r.object("EnvironmentEffectState",{entityId:r.u64(),lastBiomeId:r.u16(),lastEvaluatedAt:r.timestamp(),isSubmerged:r.bool()});r.object("EscrowItem",{escrowKey:r.string(),tradeSessionId:r.string(),itemInstanceId:r.u64(),quantity:r.u32(),ownerIdentity:r.identity(),createdAt:r.timestamp()});r.object("FeatureFlags",{flagKey:r.string(),enabled:r.bool(),updatedAt:r.timestamp()});r.object("FriendEdge",{edgeKey:r.string(),ownerIdentity:r.identity(),friendIdentity:r.identity(),status:r.u8(),updatedAt:r.timestamp()});r.object("GuildMember",{memberKey:r.string(),guildId:r.string(),memberIdentity:r.identity(),role:r.u8(),joinedAt:r.timestamp()});r.object("GuildProject",{projectId:r.string(),guildId:r.string(),title:r.string(),progressPermille:r.u16(),updatedAt:r.timestamp()});r.object("GuildState",{guildId:r.string(),name:r.string(),founderIdentity:r.identity(),createdAt:r.timestamp()});r.object("HousingState",{entityId:r.u64(),ownerIdentity:r.identity(),entranceBuildingEntityId:r.u64(),exitPortalEntityId:r.u64(),networkEntityId:r.u64(),regionIndex:r.u32(),lockedUntil:r.timestamp(),isEmpty:r.bool()});r.object("InstanceState",{instanceId:r.u64(),regionId:r.u64(),instanceType:r.u8(),ttlSeconds:r.u32()});r.object("InventoryContainer",{containerId:r.u64(),ownerIdentity:r.identity(),inventoryIndex:r.i32(),cargoIndex:r.i32(),slotCount:r.u32(),itemPocketVolume:r.i32(),cargoPocketVolume:r.i32()});r.object("InventoryLock",{containerId:r.u64(),lockReason:r.string(),lockedBy:r.identity(),expiresAt:r.timestamp()});r.object("InventorySlot",{slotKey:r.string(),containerId:r.u64(),slotIndex:r.u32(),itemInstanceId:r.u64(),volume:r.i32(),locked:r.bool(),itemType:r.u8()});r.object("ItemDef",{itemDefId:r.u64(),category:r.u8(),rarity:r.u8(),maxStack:r.u32(),volume:r.i32()});r.object("ItemInstance",{itemInstanceId:r.u64(),itemDefId:r.u64(),itemType:r.u8(),durability:r.i32(),bound:r.bool()});r.object("ItemStack",{itemInstanceId:r.u64(),quantity:r.u32()});r.object("KnowledgeState",{knowledgeKey:r.string(),entityId:r.u64(),knowledgeId:r.u64(),status:r.u8(),updatedAt:r.timestamp()});r.object("LlmParams",{paramKey:r.string(),intValue:r.i64(),floatValue:r.f64(),updatedAt:r.timestamp()});r.object("MarketFill",{fillId:r.string(),buyOrderId:r.string(),sellOrderId:r.string(),itemDefId:r.u64(),quantity:r.u32(),unitPrice:r.u64(),buyerIdentity:r.identity(),sellerIdentity:r.identity(),createdAt:r.timestamp()});r.object("MarketOrder",{orderId:r.string(),ownerIdentity:r.identity(),regionId:r.u64(),side:r.u8(),itemDefId:r.u64(),quantityOpen:r.u32(),unitPrice:r.u64(),status:r.u8(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("MetricDaily",{metricDayKey:r.string(),metricKey:r.string(),metricValue:r.f64(),recordedAt:r.timestamp()});r.object("ModerationAction",{actionId:r.u64(),targetIdentity:r.identity(),actionType:r.string(),reason:r.string(),actorIdentity:r.identity(),createdAt:r.timestamp()});r.object("ModerationFlag",{identity:r.identity(),score:r.i32(),lastReason:r.string(),updatedAt:r.timestamp()});r.object("MovementActorState",{identity:r.identity(),regionId:r.u64(),lastClientTsMs:r.u64(),lastRequestId:r.string(),lastPosition:r.array(r.f32()),updatedAt:r.timestamp()});r.object("MovementRequestLog",{requestKey:r.string(),identity:r.identity(),requestId:r.string(),regionId:r.u64(),clientTsMs:r.u64(),accepted:r.bool(),processedAt:r.timestamp()});r.object("MovementViolation",{violationId:r.string(),identity:r.identity(),reason:r.string(),ts:r.timestamp(),attemptedPosition:r.array(r.f32())});r.object("NpcActionRequest",{requestId:r.string(),npcId:r.u64(),actionKind:r.u8(),status:r.u8(),payload:r.string(),createdAt:r.timestamp()});r.object("NpcActionResult",{resultId:r.string(),requestId:r.string(),status:r.u8(),summary:r.string(),createdAt:r.timestamp()});r.object("NpcActionSchedule",{scheduleId:r.string(),npcId:r.u64(),actionKind:r.u8(),scheduledAt:r.timestamp()});r.object("NpcConversationSession",{sessionId:r.string(),npcId:r.u64(),playerIdentity:r.identity(),status:r.u8(),lastAt:r.timestamp()});r.object("NpcConversationTurn",{turnKey:r.string(),sessionId:r.string(),turnIndex:r.u32(),inputSummary:r.string(),outputSummary:r.string()});r.object("NpcCostMetrics",{metricId:r.u64(),npcId:r.u64(),tokenIn:r.u32(),tokenOut:r.u32(),costMicrounits:r.u64(),createdAt:r.timestamp()});r.object("NpcInteractionLog",{interactionKey:r.string(),npcId:r.u64(),callerIdentity:r.identity(),interactionKind:r.u8(),status:r.u8(),detail:r.string(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("NpcMemoryLong",{npcId:r.u64(),summary:r.string(),updatedAt:r.timestamp()});r.object("NpcMemoryShort",{npcId:r.u64(),summary:r.string(),updatedAt:r.timestamp()});r.object("NpcPolicyViolation",{violationId:r.u64(),npcId:r.u64(),playerIdentity:r.identity(),reason:r.string(),severity:r.u8(),createdAt:r.timestamp()});r.object("NpcRelation",{relationKey:r.string(),npcId:r.u64(),playerIdentity:r.identity(),affinity:r.i32(),trust:r.i32(),updatedAt:r.timestamp()});r.object("NpcResponseCache",{cacheKey:r.string(),npcId:r.u64(),promptHash:r.string(),responseSummary:r.string(),updatedAt:r.timestamp()});r.object("NpcState",{npcId:r.u64(),regionId:r.u64(),posX:r.f32(),posZ:r.f32(),scheduleKind:r.u8(),updatedAt:r.timestamp()});r.object("OrderFill",{fillId:r.u64(),orderId:r.string(),fillQty:r.u32(),fillPrice:r.u64(),createdAt:r.timestamp()});r.object("ParamChangeLog",{changeId:r.u64(),paramKey:r.string(),beforeInt:r.i64(),afterInt:r.i64(),beforeFloat:r.f64(),afterFloat:r.f64(),changedAt:r.timestamp()});r.object("ParamGuardrail",{guardrailKey:r.string(),minInt:r.i64(),maxInt:r.i64(),minFloat:r.f64(),maxFloat:r.f64()});r.object("PartyMember",{memberKey:r.string(),partyId:r.string(),memberIdentity:r.identity(),role:r.u8(),joinedAt:r.timestamp()});r.object("PartyState",{partyId:r.string(),leaderIdentity:r.identity(),regionId:r.u64(),createdAt:r.timestamp()});r.object("PermissionState",{permissionKey:r.string(),targetKind:r.u8(),targetId:r.u64(),subjectIdentity:r.identity(),flags:r.u32()});r.object("PlayerInventoryContainerView",{viewKey:r.string(),ownerIdentity:r.identity(),containerId:r.u64(),slotCount:r.u32(),itemPocketVolume:r.i32(),cargoPocketVolume:r.i32()});r.object("PlayerInventoryItemView",{itemInstanceId:r.u64(),ownerIdentity:r.identity(),containerId:r.u64(),slotIndex:r.u32(),itemDefId:r.u64(),quantity:r.u32(),durability:r.i32(),bound:r.bool()});r.object("PlayerInventorySlotView",{slotKey:r.string(),ownerIdentity:r.identity(),containerId:r.u64(),slotIndex:r.u32(),itemInstanceId:r.u64(),locked:r.bool(),itemType:r.u8(),volume:r.i32()});r.object("PlayerMovementFeedbackView",{requestKey:r.string(),identity:r.identity(),requestId:r.string(),accepted:r.bool(),reasonCode:r.string(),serverPos:r.array(r.f32()),processedAt:r.timestamp()});r.object("PlayerSessionView",{identity:r.identity(),regionId:r.u64(),lastActiveAt:r.timestamp()});r.object("PlayerState",{playerId:r.identity(),displayName:r.string(),createdAt:r.timestamp()});r.object("PlayerWalletView",{identity:r.identity(),balance:r.i64(),updatedAt:r.timestamp()});r.object("PriceIndex",{indexKey:r.string(),itemDefId:r.u64(),priceAvg:r.u64(),volume:r.u64(),recordedAt:r.timestamp()});r.object("QuestChainDef",{chainId:r.u64(),startNpcId:r.u64(),stageCount:r.u32(),rewardItemDefId:r.u64(),rewardItemQty:r.u32()});r.object("QuestChainState",{chainKey:r.string(),identity:r.identity(),chainId:r.u64(),status:r.u8(),startedAt:r.timestamp(),updatedAt:r.timestamp()});r.object("QuestStageDef",{stageId:r.u64(),chainId:r.u64(),objectiveType:r.u8(),objectiveTarget:r.u64(),objectiveCount:r.u32()});r.object("QuestStageState",{stageKey:r.string(),chainKey:r.string(),stageIndex:r.u32(),status:r.u8(),updatedAt:r.timestamp()});r.object("QuestState",{questKey:r.string(),entityId:r.u64(),chainId:r.u64(),stageId:r.u64(),status:r.u8(),updatedAt:r.timestamp()});r.object("RateLimitBucket",{bucketKey:r.string(),identity:r.identity(),actionType:r.string(),countInWindow:r.u32(),windowStartedAt:r.timestamp()});r.object("RegionState",{regionId:r.u64(),name:r.string(),status:r.u8(),shardLoadPermille:r.u16()});r.object("RentState",{entityId:r.u64(),whiteList:r.array(r.identity())});r.object("ReportQueue",{reportId:r.u64(),reporterIdentity:r.identity(),targetIdentity:r.identity(),reportType:r.string(),payload:r.string(),createdAt:r.timestamp()});r.object("ResourceNode",{entityId:r.u64(),resourceType:r.u8(),amount:r.u32(),respawnAt:r.timestamp()});r.object("ResourceState",{entityId:r.u64(),hp:r.u32(),stamina:r.u32(),satiation:r.u32(),lastDamageAt:r.timestamp(),lastStaminaUseAt:r.timestamp(),lastRegenAt:r.timestamp()});r.object("RoleBinding",{bindingId:r.string(),identity:r.identity(),role:r.string(),grantedAt:r.timestamp(),grantedBy:r.identity()});r.object("SessionState",{identity:r.identity(),regionId:r.u64(),lastActiveAt:r.timestamp()});r.object("SkillProgress",{skillKey:r.string(),entityId:r.u64(),skillId:r.u64(),xp:r.u64(),level:r.u32(),updatedAt:r.timestamp()});r.object("SocialFeed",{feedId:r.u64(),identityHex:r.string(),feedType:r.string(),payload:r.string(),createdAt:r.timestamp()});r.object("StatusEffect",{statusKey:r.string(),entityId:r.u64(),effectId:r.u64(),stack:r.u16(),expiresAt:r.timestamp()});r.object("TaxPolicy",{itemDefId:r.u64(),taxBps:r.u32(),updatedAt:r.timestamp()});r.object("TerrainChunk",{chunkKey:r.string(),regionId:r.u64(),chunkX:r.i32(),chunkY:r.i32(),biomeId:r.u16(),seed:r.u64()});r.object("ThreatState",{threatKey:r.string(),attackerIdentity:r.identity(),targetIdentity:r.identity(),threat:r.i32(),updatedAt:r.timestamp()});r.object("TradeOffer",{offerKey:r.string(),sessionId:r.string(),ownerIdentity:r.identity(),itemInstanceId:r.u64(),quantity:r.u32(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("TradeSession",{sessionId:r.string(),initiatorIdentity:r.identity(),partnerIdentity:r.identity(),regionId:r.u64(),phase:r.u8(),initiatorAccepted:r.bool(),partnerAccepted:r.bool(),createdAt:r.timestamp(),updatedAt:r.timestamp()});r.object("TransformState",{entityId:r.identity(),regionId:r.u64(),position:r.array(r.f32()),rotation:r.array(r.f32()),updatedAt:r.timestamp()});r.object("Wallet",{identity:r.identity(),balance:r.i64(),updatedAt:r.timestamp()});const Pd=_0(Z({name:"account",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"account_identity_key",constraint:"unique",columns:["identity"]}]},Iv),Z({name:"account_profile",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"account_profile_identity_key",constraint:"unique",columns:["identity"]}]},Rv),Z({name:"achievement_def",indexes:[{name:"achievement_id",algorithm:"btree",columns:["achievementId"]}],constraints:[{name:"achievement_def_achievement_id_key",constraint:"unique",columns:["achievementId"]}]},Cv),Z({name:"achievement_state",indexes:[{name:"achievement_key",algorithm:"btree",columns:["achievementKey"]}],constraints:[{name:"achievement_state_achievement_key_key",constraint:"unique",columns:["achievementKey"]}]},Pv),Z({name:"action_rate_violation",indexes:[{name:"violation_id",algorithm:"btree",columns:["violationId"]}],constraints:[{name:"action_rate_violation_violation_id_key",constraint:"unique",columns:["violationId"]}]},Uv),Z({name:"action_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"action_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},Dv),Z({name:"agent_request",indexes:[{name:"request_id",algorithm:"btree",columns:["requestId"]}],constraints:[{name:"agent_request_request_id_key",constraint:"unique",columns:["requestId"]}]},Lv),Z({name:"agent_result",indexes:[{name:"result_id",algorithm:"btree",columns:["resultId"]}],constraints:[{name:"agent_result_result_id_key",constraint:"unique",columns:["resultId"]}]},Nv),Z({name:"anti_cheat_event",indexes:[{name:"event_id",algorithm:"btree",columns:["eventId"]}],constraints:[{name:"anti_cheat_event_event_id_key",constraint:"unique",columns:["eventId"]}]},Fv),Z({name:"anti_cheat_params",indexes:[{name:"param_key",algorithm:"btree",columns:["paramKey"]}],constraints:[{name:"anti_cheat_params_param_key_key",constraint:"unique",columns:["paramKey"]}]},Bv),Z({name:"attack_outcome",indexes:[{name:"outcome_id",algorithm:"btree",columns:["outcomeId"]}],constraints:[{name:"attack_outcome_outcome_id_key",constraint:"unique",columns:["outcomeId"]}]},Ov),Z({name:"attack_schedule_state",indexes:[{name:"request_key",algorithm:"btree",columns:["requestKey"]}],constraints:[{name:"attack_schedule_state_request_key_key",constraint:"unique",columns:["requestKey"]}]},kv),Z({name:"audit_log",indexes:[{name:"audit_id",algorithm:"btree",columns:["auditId"]}],constraints:[{name:"audit_log_audit_id_key",constraint:"unique",columns:["auditId"]}]},Vv),Z({name:"balance_params",indexes:[{name:"param_key",algorithm:"btree",columns:["paramKey"]}],constraints:[{name:"balance_params_param_key_key",constraint:"unique",columns:["paramKey"]}]},zv),Z({name:"ban_list",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"ban_list_identity_key",constraint:"unique",columns:["identity"]}]},Gv),Z({name:"buff_state",indexes:[{name:"buff_key",algorithm:"btree",columns:["buffKey"]}],constraints:[{name:"buff_state_buff_key_key",constraint:"unique",columns:["buffKey"]}]},Hv),Z({name:"building_def",indexes:[{name:"building_def_id",algorithm:"btree",columns:["buildingDefId"]}],constraints:[{name:"building_def_building_def_id_key",constraint:"unique",columns:["buildingDefId"]}]},Wv),Z({name:"building_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"building_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},qv),Z({name:"character_stats",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"character_stats_entity_id_key",constraint:"unique",columns:["entityId"]}]},Kv),Z({name:"chat_channel",indexes:[{name:"channel_id",algorithm:"btree",columns:["channelId"]}],constraints:[{name:"chat_channel_channel_id_key",constraint:"unique",columns:["channelId"]}]},Xv),Z({name:"chat_message",indexes:[{name:"message_id",algorithm:"btree",columns:["messageId"]}],constraints:[{name:"chat_message_message_id_key",constraint:"unique",columns:["messageId"]}]},jv),Z({name:"claim_state",indexes:[{name:"claim_id",algorithm:"btree",columns:["claimId"]}],constraints:[{name:"claim_state_claim_id_key",constraint:"unique",columns:["claimId"]}]},Yv),Z({name:"combat_action_def",indexes:[{name:"action_def_id",algorithm:"btree",columns:["actionDefId"]}],constraints:[{name:"combat_action_def_action_def_id_key",constraint:"unique",columns:["actionDefId"]}]},$v),Z({name:"combat_state",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"combat_state_identity_key",constraint:"unique",columns:["identity"]}]},Zv),Z({name:"currency_txn",indexes:[{name:"txn_id",algorithm:"btree",columns:["txnId"]}],constraints:[{name:"currency_txn_txn_id_key",constraint:"unique",columns:["txnId"]}]},Jv),Z({name:"dimension_desc",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"dimension_desc_entity_id_key",constraint:"unique",columns:["entityId"]}]},Qv),Z({name:"dimension_network",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"dimension_network_entity_id_key",constraint:"unique",columns:["entityId"]}]},eS),Z({name:"economy_metric",indexes:[{name:"metric_id",algorithm:"btree",columns:["metricId"]}],constraints:[{name:"economy_metric_metric_id_key",constraint:"unique",columns:["metricId"]}]},tS),Z({name:"economy_params",indexes:[{name:"param_key",algorithm:"btree",columns:["paramKey"]}],constraints:[{name:"economy_params_param_key_key",constraint:"unique",columns:["paramKey"]}]},nS),Z({name:"entity_core",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"entity_core_entity_id_key",constraint:"unique",columns:["entityId"]}]},iS),Z({name:"environment_effect_desc",indexes:[{name:"effect_id",algorithm:"btree",columns:["effectId"]}],constraints:[{name:"environment_effect_desc_effect_id_key",constraint:"unique",columns:["effectId"]}]},rS),Z({name:"environment_effect_exposure",indexes:[{name:"exposure_key",algorithm:"btree",columns:["exposureKey"]}],constraints:[{name:"environment_effect_exposure_exposure_key_key",constraint:"unique",columns:["exposureKey"]}]},sS),Z({name:"environment_effect_loop_timer",indexes:[{name:"scheduled_id",algorithm:"btree",columns:["scheduledId"]}],constraints:[{name:"environment_effect_loop_timer_scheduled_id_key",constraint:"unique",columns:["scheduledId"]}]},aS),Z({name:"environment_effect_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"environment_effect_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},oS),Z({name:"escrow_item",indexes:[{name:"escrow_key",algorithm:"btree",columns:["escrowKey"]}],constraints:[{name:"escrow_item_escrow_key_key",constraint:"unique",columns:["escrowKey"]}]},cS),Z({name:"feature_flags",indexes:[{name:"flag_key",algorithm:"btree",columns:["flagKey"]}],constraints:[{name:"feature_flags_flag_key_key",constraint:"unique",columns:["flagKey"]}]},lS),Z({name:"friend_edge",indexes:[{name:"edge_key",algorithm:"btree",columns:["edgeKey"]}],constraints:[{name:"friend_edge_edge_key_key",constraint:"unique",columns:["edgeKey"]}]},uS),Z({name:"guild_member",indexes:[{name:"member_key",algorithm:"btree",columns:["memberKey"]}],constraints:[{name:"guild_member_member_key_key",constraint:"unique",columns:["memberKey"]}]},dS),Z({name:"guild_project",indexes:[{name:"project_id",algorithm:"btree",columns:["projectId"]}],constraints:[{name:"guild_project_project_id_key",constraint:"unique",columns:["projectId"]}]},hS),Z({name:"guild_state",indexes:[{name:"guild_id",algorithm:"btree",columns:["guildId"]}],constraints:[{name:"guild_state_guild_id_key",constraint:"unique",columns:["guildId"]}]},fS),Z({name:"housing_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"housing_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},pS),Z({name:"instance_state",indexes:[{name:"instance_id",algorithm:"btree",columns:["instanceId"]}],constraints:[{name:"instance_state_instance_id_key",constraint:"unique",columns:["instanceId"]}]},mS),Z({name:"interior_collapse_timer",indexes:[{name:"scheduled_id",algorithm:"btree",columns:["scheduledId"]}],constraints:[{name:"interior_collapse_timer_scheduled_id_key",constraint:"unique",columns:["scheduledId"]}]},_S),Z({name:"inventory_container",indexes:[{name:"container_id",algorithm:"btree",columns:["containerId"]}],constraints:[{name:"inventory_container_container_id_key",constraint:"unique",columns:["containerId"]}]},gS),Z({name:"inventory_lock",indexes:[{name:"container_id",algorithm:"btree",columns:["containerId"]}],constraints:[{name:"inventory_lock_container_id_key",constraint:"unique",columns:["containerId"]}]},yS),Z({name:"inventory_slot",indexes:[{name:"slot_key",algorithm:"btree",columns:["slotKey"]}],constraints:[{name:"inventory_slot_slot_key_key",constraint:"unique",columns:["slotKey"]}]},xS),Z({name:"item_def",indexes:[{name:"item_def_id",algorithm:"btree",columns:["itemDefId"]}],constraints:[{name:"item_def_item_def_id_key",constraint:"unique",columns:["itemDefId"]}]},vS),Z({name:"item_instance",indexes:[{name:"item_instance_id",algorithm:"btree",columns:["itemInstanceId"]}],constraints:[{name:"item_instance_item_instance_id_key",constraint:"unique",columns:["itemInstanceId"]}]},SS),Z({name:"item_stack",indexes:[{name:"item_instance_id",algorithm:"btree",columns:["itemInstanceId"]}],constraints:[{name:"item_stack_item_instance_id_key",constraint:"unique",columns:["itemInstanceId"]}]},bS),Z({name:"knowledge_state",indexes:[{name:"knowledge_key",algorithm:"btree",columns:["knowledgeKey"]}],constraints:[{name:"knowledge_state_knowledge_key_key",constraint:"unique",columns:["knowledgeKey"]}]},MS),Z({name:"llm_params",indexes:[{name:"param_key",algorithm:"btree",columns:["paramKey"]}],constraints:[{name:"llm_params_param_key_key",constraint:"unique",columns:["paramKey"]}]},wS),Z({name:"market_fill",indexes:[{name:"fill_id",algorithm:"btree",columns:["fillId"]}],constraints:[{name:"market_fill_fill_id_key",constraint:"unique",columns:["fillId"]}]},ES),Z({name:"market_order",indexes:[{name:"order_id",algorithm:"btree",columns:["orderId"]}],constraints:[{name:"market_order_order_id_key",constraint:"unique",columns:["orderId"]}]},TS),Z({name:"metric_daily",indexes:[{name:"metric_day_key",algorithm:"btree",columns:["metricDayKey"]}],constraints:[{name:"metric_daily_metric_day_key_key",constraint:"unique",columns:["metricDayKey"]}]},AS),Z({name:"moderation_action",indexes:[{name:"action_id",algorithm:"btree",columns:["actionId"]}],constraints:[{name:"moderation_action_action_id_key",constraint:"unique",columns:["actionId"]}]},IS),Z({name:"moderation_flag",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"moderation_flag_identity_key",constraint:"unique",columns:["identity"]}]},RS),Z({name:"movement_actor_state",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"movement_actor_state_identity_key",constraint:"unique",columns:["identity"]}]},CS),Z({name:"movement_request_log",indexes:[{name:"request_key",algorithm:"btree",columns:["requestKey"]}],constraints:[{name:"movement_request_log_request_key_key",constraint:"unique",columns:["requestKey"]}]},PS),Z({name:"movement_violation",indexes:[{name:"violation_id",algorithm:"btree",columns:["violationId"]}],constraints:[{name:"movement_violation_violation_id_key",constraint:"unique",columns:["violationId"]}]},US),Z({name:"npc_action_request",indexes:[{name:"request_id",algorithm:"btree",columns:["requestId"]}],constraints:[{name:"npc_action_request_request_id_key",constraint:"unique",columns:["requestId"]}]},DS),Z({name:"npc_action_result",indexes:[{name:"result_id",algorithm:"btree",columns:["resultId"]}],constraints:[{name:"npc_action_result_result_id_key",constraint:"unique",columns:["resultId"]}]},LS),Z({name:"npc_action_schedule",indexes:[{name:"schedule_id",algorithm:"btree",columns:["scheduleId"]}],constraints:[{name:"npc_action_schedule_schedule_id_key",constraint:"unique",columns:["scheduleId"]}]},NS),Z({name:"npc_conversation_session",indexes:[{name:"session_id",algorithm:"btree",columns:["sessionId"]}],constraints:[{name:"npc_conversation_session_session_id_key",constraint:"unique",columns:["sessionId"]}]},FS),Z({name:"npc_conversation_turn",indexes:[{name:"turn_key",algorithm:"btree",columns:["turnKey"]}],constraints:[{name:"npc_conversation_turn_turn_key_key",constraint:"unique",columns:["turnKey"]}]},BS),Z({name:"npc_cost_metrics",indexes:[{name:"metric_id",algorithm:"btree",columns:["metricId"]}],constraints:[{name:"npc_cost_metrics_metric_id_key",constraint:"unique",columns:["metricId"]}]},OS),Z({name:"npc_interaction_log",indexes:[{name:"interaction_key",algorithm:"btree",columns:["interactionKey"]}],constraints:[{name:"npc_interaction_log_interaction_key_key",constraint:"unique",columns:["interactionKey"]}]},kS),Z({name:"npc_memory_long",indexes:[{name:"npc_id",algorithm:"btree",columns:["npcId"]}],constraints:[{name:"npc_memory_long_npc_id_key",constraint:"unique",columns:["npcId"]}]},VS),Z({name:"npc_memory_short",indexes:[{name:"npc_id",algorithm:"btree",columns:["npcId"]}],constraints:[{name:"npc_memory_short_npc_id_key",constraint:"unique",columns:["npcId"]}]},zS),Z({name:"npc_policy_violation",indexes:[{name:"violation_id",algorithm:"btree",columns:["violationId"]}],constraints:[{name:"npc_policy_violation_violation_id_key",constraint:"unique",columns:["violationId"]}]},GS),Z({name:"npc_relation",indexes:[{name:"relation_key",algorithm:"btree",columns:["relationKey"]}],constraints:[{name:"npc_relation_relation_key_key",constraint:"unique",columns:["relationKey"]}]},HS),Z({name:"npc_response_cache",indexes:[{name:"cache_key",algorithm:"btree",columns:["cacheKey"]}],constraints:[{name:"npc_response_cache_cache_key_key",constraint:"unique",columns:["cacheKey"]}]},WS),Z({name:"npc_state",indexes:[{name:"npc_id",algorithm:"btree",columns:["npcId"]}],constraints:[{name:"npc_state_npc_id_key",constraint:"unique",columns:["npcId"]}]},qS),Z({name:"order_fill",indexes:[{name:"fill_id",algorithm:"btree",columns:["fillId"]}],constraints:[{name:"order_fill_fill_id_key",constraint:"unique",columns:["fillId"]}]},KS),Z({name:"param_change_log",indexes:[{name:"change_id",algorithm:"btree",columns:["changeId"]}],constraints:[{name:"param_change_log_change_id_key",constraint:"unique",columns:["changeId"]}]},XS),Z({name:"param_guardrail",indexes:[{name:"guardrail_key",algorithm:"btree",columns:["guardrailKey"]}],constraints:[{name:"param_guardrail_guardrail_key_key",constraint:"unique",columns:["guardrailKey"]}]},jS),Z({name:"party_member",indexes:[{name:"member_key",algorithm:"btree",columns:["memberKey"]}],constraints:[{name:"party_member_member_key_key",constraint:"unique",columns:["memberKey"]}]},YS),Z({name:"party_state",indexes:[{name:"party_id",algorithm:"btree",columns:["partyId"]}],constraints:[{name:"party_state_party_id_key",constraint:"unique",columns:["partyId"]}]},$S),Z({name:"permission_state",indexes:[{name:"permission_key",algorithm:"btree",columns:["permissionKey"]}],constraints:[{name:"permission_state_permission_key_key",constraint:"unique",columns:["permissionKey"]}]},ZS),Z({name:"player_inventory_container_view",indexes:[{name:"view_key",algorithm:"btree",columns:["viewKey"]}],constraints:[{name:"player_inventory_container_view_view_key_key",constraint:"unique",columns:["viewKey"]}]},JS),Z({name:"player_inventory_item_view",indexes:[{name:"item_instance_id",algorithm:"btree",columns:["itemInstanceId"]}],constraints:[{name:"player_inventory_item_view_item_instance_id_key",constraint:"unique",columns:["itemInstanceId"]}]},QS),Z({name:"player_inventory_slot_view",indexes:[{name:"slot_key",algorithm:"btree",columns:["slotKey"]}],constraints:[{name:"player_inventory_slot_view_slot_key_key",constraint:"unique",columns:["slotKey"]}]},eb),Z({name:"player_movement_feedback_view",indexes:[{name:"request_key",algorithm:"btree",columns:["requestKey"]}],constraints:[{name:"player_movement_feedback_view_request_key_key",constraint:"unique",columns:["requestKey"]}]},tb),Z({name:"player_regen_loop_timer",indexes:[{name:"scheduled_id",algorithm:"btree",columns:["scheduledId"]}],constraints:[{name:"player_regen_loop_timer_scheduled_id_key",constraint:"unique",columns:["scheduledId"]}]},nb),Z({name:"player_session_view",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"player_session_view_identity_key",constraint:"unique",columns:["identity"]}]},ib),Z({name:"player_state",indexes:[{name:"player_id",algorithm:"btree",columns:["playerId"]}],constraints:[{name:"player_state_player_id_key",constraint:"unique",columns:["playerId"]}]},rb),Z({name:"player_wallet_view",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"player_wallet_view_identity_key",constraint:"unique",columns:["identity"]}]},sb),Z({name:"price_index",indexes:[{name:"index_key",algorithm:"btree",columns:["indexKey"]}],constraints:[{name:"price_index_index_key_key",constraint:"unique",columns:["indexKey"]}]},ab),Z({name:"quest_chain_def",indexes:[{name:"chain_id",algorithm:"btree",columns:["chainId"]}],constraints:[{name:"quest_chain_def_chain_id_key",constraint:"unique",columns:["chainId"]}]},ob),Z({name:"quest_chain_state",indexes:[{name:"chain_key",algorithm:"btree",columns:["chainKey"]}],constraints:[{name:"quest_chain_state_chain_key_key",constraint:"unique",columns:["chainKey"]}]},cb),Z({name:"quest_stage_def",indexes:[{name:"stage_id",algorithm:"btree",columns:["stageId"]}],constraints:[{name:"quest_stage_def_stage_id_key",constraint:"unique",columns:["stageId"]}]},lb),Z({name:"quest_stage_state",indexes:[{name:"stage_key",algorithm:"btree",columns:["stageKey"]}],constraints:[{name:"quest_stage_state_stage_key_key",constraint:"unique",columns:["stageKey"]}]},ub),Z({name:"quest_state",indexes:[{name:"quest_key",algorithm:"btree",columns:["questKey"]}],constraints:[{name:"quest_state_quest_key_key",constraint:"unique",columns:["questKey"]}]},db),Z({name:"rate_limit_bucket",indexes:[{name:"bucket_key",algorithm:"btree",columns:["bucketKey"]}],constraints:[{name:"rate_limit_bucket_bucket_key_key",constraint:"unique",columns:["bucketKey"]}]},hb),Z({name:"region_state",indexes:[{name:"region_id",algorithm:"btree",columns:["regionId"]}],constraints:[{name:"region_state_region_id_key",constraint:"unique",columns:["regionId"]}]},fb),Z({name:"rent_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"rent_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},pb),Z({name:"report_queue",indexes:[{name:"report_id",algorithm:"btree",columns:["reportId"]}],constraints:[{name:"report_queue_report_id_key",constraint:"unique",columns:["reportId"]}]},mb),Z({name:"resource_node",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"resource_node_entity_id_key",constraint:"unique",columns:["entityId"]}]},_b),Z({name:"resource_regen_loop_timer",indexes:[{name:"scheduled_id",algorithm:"btree",columns:["scheduledId"]}],constraints:[{name:"resource_regen_loop_timer_scheduled_id_key",constraint:"unique",columns:["scheduledId"]}]},gb),Z({name:"resource_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"resource_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},yb),Z({name:"role_binding",indexes:[{name:"binding_id",algorithm:"btree",columns:["bindingId"]}],constraints:[{name:"role_binding_binding_id_key",constraint:"unique",columns:["bindingId"]}]},xb),Z({name:"session_cleanup_loop_timer",indexes:[{name:"scheduled_id",algorithm:"btree",columns:["scheduledId"]}],constraints:[{name:"session_cleanup_loop_timer_scheduled_id_key",constraint:"unique",columns:["scheduledId"]}]},vb),Z({name:"session_state",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"session_state_identity_key",constraint:"unique",columns:["identity"]}]},Sb),Z({name:"skill_progress",indexes:[{name:"skill_key",algorithm:"btree",columns:["skillKey"]}],constraints:[{name:"skill_progress_skill_key_key",constraint:"unique",columns:["skillKey"]}]},bb),Z({name:"social_feed",indexes:[{name:"feed_id",algorithm:"btree",columns:["feedId"]}],constraints:[{name:"social_feed_feed_id_key",constraint:"unique",columns:["feedId"]}]},Mb),Z({name:"status_effect",indexes:[{name:"status_key",algorithm:"btree",columns:["statusKey"]}],constraints:[{name:"status_effect_status_key_key",constraint:"unique",columns:["statusKey"]}]},wb),Z({name:"tax_policy",indexes:[{name:"item_def_id",algorithm:"btree",columns:["itemDefId"]}],constraints:[{name:"tax_policy_item_def_id_key",constraint:"unique",columns:["itemDefId"]}]},Eb),Z({name:"terrain_chunk",indexes:[{name:"chunk_key",algorithm:"btree",columns:["chunkKey"]}],constraints:[{name:"terrain_chunk_chunk_key_key",constraint:"unique",columns:["chunkKey"]}]},Tb),Z({name:"threat_state",indexes:[{name:"threat_key",algorithm:"btree",columns:["threatKey"]}],constraints:[{name:"threat_state_threat_key_key",constraint:"unique",columns:["threatKey"]}]},Ab),Z({name:"trade_offer",indexes:[{name:"offer_key",algorithm:"btree",columns:["offerKey"]}],constraints:[{name:"trade_offer_offer_key_key",constraint:"unique",columns:["offerKey"]}]},Ib),Z({name:"trade_session",indexes:[{name:"session_id",algorithm:"btree",columns:["sessionId"]}],constraints:[{name:"trade_session_session_id_key",constraint:"unique",columns:["sessionId"]}]},Rb),Z({name:"transform_state",indexes:[{name:"entity_id",algorithm:"btree",columns:["entityId"]}],constraints:[{name:"transform_state_entity_id_key",constraint:"unique",columns:["entityId"]}]},Cb),Z({name:"wallet",indexes:[{name:"identity",algorithm:"btree",columns:["identity"]}],constraints:[{name:"wallet_identity_key",constraint:"unique",columns:["identity"]}]},Pb)),Ud=o0(Re("account_bootstrap",y0),Re("agent_tick",x0),Re("attack_impact",v0),Re("attack_scheduled",S0),Re("attack_start",b0),Re("building_advance",M0),Re("building_deconstruct",w0),Re("building_place",E0),Re("chat_send_message",T0),Re("claim_expand",A0),Re("claim_totem_place",I0),Re("economy_set_param",R0),Re("environment_effect_agent_loop",P0),Re("guild_create",U0),Re("guild_join",D0),Re("guild_project_update",L0),Re("guild_set_role",N0),Re("housing_change_entrance",F0),Re("housing_create",B0),Re("housing_enter",O0),Re("housing_propagate_permissions",k0),Re("import_csv_by_type",V0),Re("import_csv_data",z0),Re("interior_collapse_rebuild",H0),Re("interior_mark_empty",W0),Re("inventory_bootstrap",q0),Re("item_stack_move",K0),Re("lock_inventory_container",X0),Re("market_order_cancel",j0),Re("market_order_match",Y0),Re("market_order_place",$0),Re("moderation_apply_action",Z0),Re("move_to",J0),Re("npc_quest",Q0),Re("npc_talk",ev),Re("npc_trade",tv),Re("party_create",nv),Re("party_join",iv),Re("party_leave",rv),Re("party_transfer_leader",sv),Re("player_regen_agent_loop",ov),Re("quest_chain_start",cv),Re("quest_stage_complete",lv),Re("rent_set_whitelist",uv),Re("report_review",dv),Re("report_submit",hv),Re("resource_regen_agent_loop",pv),Re("role_grant",mv),Re("role_revoke",_v),Re("seed_data",gv),Re("session_cleanup_agent_loop",xv),Re("sign_in",vv),Re("sign_out",Sv),Re("start_world_agents",bv),Re("tax_policy_set",Mv),Re("trade_accept",wv),Re("trade_item_add",Ev),Re("trade_session_open",Tv),Re("unlock_inventory_container",Av)),Ub=l0(),Db={versionInfo:{cliVersion:"1.11.3"},tables:Pd.schemaType.tables,reducers:Ud.reducersType.reducers,...Ub};Cd(Pd.schemaType.tables);Cd(Ud.reducersType.reducers);class Lb extends vd{}class Nb extends $x{}const ga=class ga extends e0{constructor(){super(...arguments);le(this,"subscriptionBuilder",()=>new Lb(this))}};le(ga,"builder",()=>new Nb(Db,t=>new ga(t)));let mc=ga;const Fb=3e4,Bb=1e3;function Ob(n,e,t,i){let s=null,a=!1,o=!1,c=0,l=null;const u=async()=>{if(a||s)return;a=!0;const f=t.load()??void 0;try{mc.builder().withUri(n.spacetimeUri).withModuleName(n.spacetimeModuleName).withCompression("gzip").withToken(f).onConnect((m,y,v)=>{s=m,c=0,l=null,t.save(v),i.push({kind:"connected",identityHex:y.toHexString()})}).onConnectError((m,y)=>{s=null,i.push({kind:"connect-error",error:y}),d(m.isActive)}).onDisconnect((m,y)=>{s=null,i.push({kind:"disconnected",error:y}),o||d(m.isActive)}).build(),e.info("network connect initiated",{uri:n.spacetimeUri,moduleName:n.spacetimeModuleName,hasToken:!!f})}finally{a=!1}},d=f=>{if(o)return;c+=1;const p=Math.min(Bb*2**(c-1),Fb);l=Date.now()+p,i.push({kind:"reconnect-scheduled",retryCount:c,delayMs:p})};return{async connect(){o=!1,await u()},disconnect(){o=!0,l=null,c=0,s&&(s.disconnect(),s=null)},poll(){o||s||a||l===null||Date.now()<l||u()},getConnection(){return s},dispatchReducer(f,p){if(!s||!s.isActive)return!1;const m=kb(f),v=s.reducers[m];if(!v)return i.push({kind:"reducer-failed",reducer:f,error:new Error(`Reducer not found: ${m}`)}),!1;try{return v(p),i.push({kind:"reducer-dispatched",reducer:f}),!0}catch(_){return i.push({kind:"reducer-failed",reducer:f,error:Vb(_)}),!1}}}}function kb(n){return n.replace(/[_-](\w)/g,(e,t)=>t.toUpperCase())}function Vb(n){return n instanceof Error?n:new Error(String(n))}class zb{constructor(){le(this,"events",[])}push(e){this.events.push(e)}drain(){return this.events.length===0?[]:this.events.splice(0,this.events.length)}}class Gb{constructor(){le(this,"intents",[])}enqueue(e){this.intents.push(e)}drain(){return this.intents.length===0?[]:this.intents.splice(0,this.intents.length)}}class Hb{constructor(){le(this,"specs",new Map)}register(e,t){this.specs.set(e,{key:e,queries:[...t]})}activateAll(e,t){for(const i of this.specs.values())try{i.handle&&!i.handle.isEnded()&&i.handle.unsubscribe();const s=e.subscriptionBuilder().onApplied(()=>t.onApplied(i.key)).onError(a=>t.onError(i.key,a.event??new Error("unknown subscription error"))).subscribe(i.queries);i.handle=s}catch(s){t.onError(i.key,Wb(s))}}deactivateAll(){for(const e of this.specs.values())!e.handle||e.handle.isEnded()||(e.handle.unsubscribe(),e.handle=void 0)}clear(){this.deactivateAll(),this.specs.clear()}values(){return[...this.specs.keys()]}}function Wb(n){return n instanceof Error?n:new Error(String(n))}const qb=[{key:"session-baseline",queries:["SELECT * FROM player_session_view"]},{key:"movement-feedback",queries:["SELECT * FROM player_movement_feedback_view"]},{key:"world-baseline",queries:["SELECT * FROM transform_state"]}];function Kb(){const n=new zb,e=new Hb,t=new Gb;let i=null;return{name:"NetRuntime",async start(s){for(const a of qb)e.register(a.key,a.queries);i=Ob(s.config,s.logger,s.tokenStore,n),await i.connect(),s.logger.info("net runtime start",{subscriptions:e.values()})},tick(s){var a;i==null||i.poll();for(const o of n.drain())switch(o.kind){case"connected":{s.appState.value==="Connecting"&&(s.appState.transition("Authenticating"),Xb(t));const c=i==null?void 0:i.getConnection();c&&e.activateAll(c,{onApplied:l=>n.push({kind:"subscription-applied",key:l}),onError:(l,u)=>n.push({kind:"subscription-error",key:l,error:u})}),s.logger.info("spacetimedb connected",{identity:o.identityHex});break}case"connect-error":{cu(s),s.logger.warn("spacetimedb connect error",{error:o.error.message});break}case"disconnected":{e.deactivateAll(),cu(s),s.logger.warn("spacetimedb disconnected",{error:(a=o.error)==null?void 0:a.message});break}case"reconnect-scheduled":{s.logger.warn("spacetimedb reconnect scheduled",{retryCount:o.retryCount,delayMs:o.delayMs});break}case"subscription-applied":{s.appState.value==="Authenticating"?(s.appState.transition("CharacterReady"),s.appState.transition("InWorld")):s.appState.value==="Reconnecting"&&s.appState.transition("InWorld"),s.logger.info("subscription applied",{key:o.key});break}case"subscription-error":{s.logger.error("subscription failed",{key:o.key,error:o.error.message});break}case"reducer-dispatched":{s.logger.debug("reducer dispatched",{reducer:o.reducer});break}case"reducer-failed":{s.logger.warn("reducer dispatch failed",{reducer:o.reducer,error:o.error.message});break}}for(const o of t.drain())i==null||i.dispatchReducer(o.name,o.payload)},stop(s){e.clear(),i==null||i.disconnect(),s.logger.info("net runtime stop")}}}function Xb(n){n.enqueue({name:"account_bootstrap",payload:{displayName:"WebPlayer"}}),n.enqueue({name:"sign_in",payload:{regionId:1n}})}function cu(n){(n.appState.value==="Connecting"||n.appState.value==="Authenticating"||n.appState.value==="CharacterReady"||n.appState.value==="InWorld")&&n.appState.transition("Reconnecting")}function jb(){return{name:"SocialNpcQuestRuntime",start(n){n.logger.info("social-npc-quest runtime start")},tick(){},stop(n){n.logger.info("social-npc-quest runtime stop")}}}function Yb(){return{name:"SyncRuntime",start(n){n.logger.info("sync runtime start")},tick(){},stop(n){n.logger.info("sync runtime stop")}}}class $b{constructor(e){le(this,"root");this.root=document.createElement("div"),this.root.style.position="absolute",this.root.style.inset="0",this.root.style.pointerEvents="none",this.root.style.padding="12px",this.root.textContent="HUD: booting",e.appendChild(this.root)}setStatus(e){this.root.textContent=`HUD: ${e}`}destroy(){this.root.remove()}}class Zb{constructor(e){le(this,"root");this.root=document.createElement("div"),this.root.style.position="absolute",this.root.style.right="12px",this.root.style.bottom="12px",this.root.style.padding="8px 10px",this.root.style.background="rgba(12, 18, 28, 0.66)",this.root.style.border="1px solid rgba(120, 162, 214, 0.4)",this.root.style.borderRadius="8px",this.root.style.fontSize="12px",this.root.textContent="Panels: inactive",e.appendChild(this.root)}setText(e){this.root.textContent=`Panels: ${e}`}destroy(){this.root.remove()}}function Jb(){let n=null,e=null;return{name:"UiRuntime",start(t){n=new $b(t.root),e=new Zb(t.root),n.setStatus("ready"),e.setText("skeleton"),t.logger.info("ui runtime start")},tick(t){n==null||n.setStatus(`${t.appState.value} | frame ${t.frame}`)},stop(t){n==null||n.destroy(),e==null||e.destroy(),n=null,e=null,t.logger.info("ui runtime stop")}}}function Qb(){return{name:"WorldRuntime",start(n){n.logger.info("world runtime start")},tick(){},stop(n){n.logger.info("world runtime stop")}}}const eM={Boot:["LoadingAssets","Disconnected"],LoadingAssets:["Connecting","Disconnected"],Connecting:["Authenticating","Reconnecting","Disconnected"],Authenticating:["CharacterReady","Disconnected","Reconnecting"],CharacterReady:["InWorld","Disconnected","Reconnecting"],InWorld:["Reconnecting","Disconnected"],Reconnecting:["InWorld","Disconnected"],Disconnected:["Connecting"]};class tM{constructor(){le(this,"current","Boot")}get value(){return this.current}transition(e){if(!eM[this.current].includes(e))throw new Error(`Invalid state transition: ${this.current} -> ${e}`);this.current=e}}async function nM(n){if(!n)throw new Error("Root element not found: #app");n.style.position="relative";const e=Wd(),t=qd(e.logLevel),i=new Kd(e.tokenStorageKey),s=new tM,a=Hd(),o=py(n),c={root:n,config:e,logger:t,tokenStore:i,appState:s,world:a,renderer:o,frame:0},l=[gy(),Kb(),Yb(),Qb(),_y(),xy(),my(),jb(),Jb(),yy()];for(const d of l)await d.start(c);c.appState.transition("LoadingAssets"),c.appState.transition("Connecting"),c.renderer.start(d=>{c.frame+=1;for(const f of l)f.tick(c,d)});const u=async()=>{c.renderer.stop();for(const d of[...l].reverse())await d.stop(c)};window.addEventListener("beforeunload",()=>{u()})}nM(document.getElementById("app"));
