/* 
    автор(с): Ярослав Мосорук
              JavaScript ES6 HTML5
*/

var g_inf = { 
	paint:null,
	update:null,
	kdown:null,
	kup:null,
	hdc:null,
	frame:null,
	prev:0,
	obj:null,
	fps:0,
	cnt:0,
	delay:10,
	delta:0.0,
	last:0
};


//класс холст-игры
class canvas {
	//создание
	static create(obj, width, height){
		g_inf.obj = obj;
		g_inf.hdc = obj.getContext("2d");
		g_inf.paint = g_inf.update = g_inf.kdown = g_inf.kup = null;	
	}


	//добавление обработчиков
	static set eventPaint(paint){
		g_inf.paint = paint;
	}

	static set eventUpdate(update){
		g_inf.update = update;
	}

	static set eventClick(click){
		g_inf.obj.onclick = click;
	}

	static eventKeyDownUp(down, up){
		g_inf.kdown = down;
		g_inf.kup   = up;
 		if(typeof(window.onkeydown) != "undefined")
			window.onkeydown  = canvas.key_down;
		else if(typeof(window.onkeypress) != "undefined")
			window.onkeypress = canvas.key_down;
		window.onkeyup = canvas.key_up;
	}

	static key_down(e){
		let key = window.event || e;
		g_inf.kdown(key.keyCode);
	}

	static key_up(e){
		let key = window.event || e;
		g_inf.kup(key.keyCode);
	}

	//запуск
	static run(){
		g_inf.fps   = g_inf.cnt  = 0;
		g_inf.prev  = g_inf.last = performance.now();
		canvas.render(g_inf.prev);
	}

	//остановка
	static stop(){
		if(g_inf.frame != null)
			cancelAnimationFrame(g_inf.frame);
		g_inf.frame = null;
		g_inf.last  = 0;
	}

	static isStop(){
		return (g_inf.last == 0);
	}

	static set delay(msec){
		g_inf.delay = msec;
	}

	static get delay(){
		return g_inf.delay;
	}

	static get FPS(){
		return g_inf.fps;
	}

	static get elapsed(){
		return g_inf.delta;
	}

	static get tick(){
		return performance.now();
	}

	static get frontDC(){
		return g_inf.hdc;
	}


	//перерисовка
	static render(time){
		let cur = time - g_inf.prev;
		if(cur > g_inf.delay){
			g_inf.prev  = time;
			g_inf.delta = cur * 0.1;

			g_inf.update(time, g_inf.delta);
			g_inf.paint(g_inf.hdc);
		}

		++g_inf.cnt;
		if((time - g_inf.last) >= 1000){
			g_inf.last = time;
			g_inf.fps  = g_inf.cnt;
			g_inf.cnt  = 0;
		}
		g_inf.frame = requestAnimationFrame(canvas.render);
	}
}


//рисование-начального меню
function show_menu(){
	g_menu  = true;
	const w = g_inf.obj.width;
	const h = g_inf.obj.height;
	g_inf.hdc.clearRect(0, 0, w, h);

	let cy = Math.ceil(w * 0.16);
	g_inf.hdc.font = cy + FONT_FACE;

	const str = "ХУЄТРИС";
	let    sz = g_inf.hdc.measureText(str);
	g_inf.hdc.fillStyle = "#0044BB";

	for(let i = 3; i >= 0; --i)
		g_inf.hdc.fillText(str, (w - sz.width)/2 - i, (h - cy)/4 - i);
	g_inf.hdc.fillStyle = "#00AAFF";
	g_inf.hdc.fillText(str, (w - sz.width)/2 + 1, (h - cy)/4 + 1);

	let bw  = Math.floor(w * 0.6);
	let bh  = Math.floor(h * 0.1);
	let sep = Math.floor(h * 0.06);
	let top = Math.floor(h / 3);

	//з-кнопки
	const tmp = g_inf.hdc.shadowBlur;
	g_inf.hdc.fillStyle   = "#111188";
	g_inf.hdc.strokeStyle = "#8888FF";
	g_inf.hdc.shadowBlur  = Math.ceil(sep * 0.5);
	g_inf.hdc.shadowColor = "#0000FF";
	let p;
	for(let i = 0; i < 3; ++i, top += bh + sep){
		p = Math.round((w - bw) / 2);
		g_inf.hdc.fillRect(p, top, bw, bh);
		g_inf.hdc.strokeRect(p, top, bw, bh);
	}
	g_inf.hdc.shadowBlur = tmp;

	cy = Math.ceil(w * 0.05);
	g_inf.hdc.font = cy + FONT_FACE;
	g_inf.hdc.fillStyle   = "#FFAA44";
	g_inf.hdc.strokeStyle = "#AA6611";

	top = Math.floor(h / 3);
	const bs = ["ПОЧНИ ХУЯРИТЬ", "ЯК РУХАТИ ХУЯМИ", "Швидкість ХУЇВ"];
	let m;
	for(let i = 0; i < bs.length; ++i, top += bh + sep){
		p = Math.floor((w - g_inf.hdc.measureText(bs[i]).width)/2);
		m = Math.round(top + cy + cy*0.5);
		g_inf.hdc.fillText(bs[i], p,  m);
		g_inf.hdc.strokeText(bs[i], p, m);
	}

	const author = "Ярослав Мосорук";
	g_inf.hdc.fillStyle = "#008800";
	g_inf.hdc.fillText(author, (g_inf.obj.width - g_inf.hdc.measureText(author).width)/2, g_inf.obj.height - cy - cy*0.5);
}


//показ конец игры
function show_game_over(){
	const  w = g_inf.obj.width  * 0.8;
	const  h = g_inf.obj.height * 0.58;
	const rx = w / 2;
	const ry = h / 2;
	const mx = g_inf.obj.width  / 2;
	const my = g_inf.obj.height / 2;

	let cur = g_inf.hdc.shadowBlur;
	g_inf.hdc.fillStyle   = "rgba(0,0,0,0.5)";
	g_inf.hdc.strokeStyle = "#FF0000";
	g_inf.hdc.shadowBlur  = Math.ceil(Math.min(rx, ry) * 0.1);
	g_inf.hdc.shadowColor = "#FF3221";

	let x, y, t, m = 360 / 12;
	g_inf.hdc.beginPath();
	for(let i = 0; i <= 360; i += m){
		t = i * (Math.PI / 180.0);
		x = mx + rx * Math.sin(t);
		y = my + ry * Math.cos(t);
		if(i == 0)
			g_inf.hdc.moveTo(x, y);
		else
			g_inf.hdc.lineTo(x, y);
	}
	g_inf.hdc.closePath();
	g_inf.hdc.fill();
	g_inf.hdc.stroke();
	g_inf.hdc.shadowBlur = cur;

	g_inf.hdc.fillStyle = "#FFBB22";

	let cy = Math.ceil(w * 0.08);
	g_inf.hdc.font = cy + FONT_FACE;
	const str = "ТИ ПРОЄБАВ";
	
	x = (g_inf.obj.width  - g_inf.hdc.measureText(str).width)/2;
	y = (g_inf.obj.height - cy*2)/2;
	g_inf.hdc.fillText(str, x, y);
	g_inf.hdc.strokeText(str, x, y);

	cy = Math.ceil(w * 0.05);
	g_inf.hdc.font = cy + FONT_FACE;
	const but = "ПОЧНИ ЗАНОВО ХУЯРИТЬ";

	m = g_inf.hdc.measureText(but).width;
	x = (g_inf.obj.width  - m)/2;
	y = (g_inf.obj.height - cy)/2 + cy*3;

	t = cy * 2;
	cur = g_inf.hdc.fillStyle;
	g_inf.hdc.fillStyle = "#000088";
	g_inf.hdc.fillRect(x - cy, y - t, m + t, t + cy + cy*0.5);
	g_inf.hdc.strokeRect(x - cy, y - t, m + t, t + cy + cy*0.5);

	g_inf.hdc.fillStyle = cur;
	g_inf.hdc.fillText(but, x, y);
}


//управление игрой
function show_help(){
	const em = Math.min(g_inf.obj.width, g_inf.obj.height) * 0.004;
	const c0 = "#00AA00";
	const c1 = "#77AA11"
	const  w = g_inf.obj.width  - em*2;
	const  h = g_inf.obj.height * 0.22;

	g_inf.hdc.lineWidth   = 1;
	g_inf.hdc.fillStyle   = "#002200";
	g_inf.hdc.strokeStyle = c0;
	g_inf.hdc.fillRect((g_inf.obj.width - w)/2, g_inf.obj.height - h - em, w, h);
	g_inf.hdc.strokeRect((g_inf.obj.width - w)/2, g_inf.obj.height - h - em, w, h);

	let cy = Math.ceil(w * 0.03);
	g_inf.hdc.font = cy + FONT_FACE;

	g_inf.hdc.fillStyle = c0;
	const hs = "УПРАВЛІННЯ ГРОЮ";

	let top = g_inf.obj.height - h + cy;
	g_inf.hdc.fillText(hs, (w - g_inf.hdc.measureText(hs).width)/2, top);

	let fh = cy + cy * 0.5;
	top += fh;

	const cs = [
		"Управління клавіатурою:", 
		"Повернути ХУЙ вліво - клавиша вліво или A", 
		"Повернути ХУЙ вправо - клавиша вправо или D", 
		"Повернути ХУЙ вниз - клавиша вниз или S", 
		"Крутити ХУЙ - клавиша вверх или W"
	];

	let max = 0;
	for(let i = 1; i < cs.length; ++i){
		if(cs[i].length > cs[max].length)
			max = i;
	}

	const x = (w - g_inf.hdc.measureText(cs[max]).width)/2;
	g_inf.hdc.fillText(cs[0], x, top);
	top += fh;
	fh   = cy + cy * 0.38;

	g_inf.hdc.fillStyle = c1;
	for(let i = 1; i < cs.length; ++i, top += fh)
		g_inf.hdc.fillText(cs[i], x, top);	
}


//получение индекса-кнопки
const command_get = (x, y) => {
	const bw  = Math.floor(g_inf.obj.width  * 0.6);
	const bh  = Math.floor(g_inf.obj.height * 0.1);
	const sep = Math.floor(g_inf.obj.height * 0.06);
	let px,py = Math.floor(g_inf.obj.height / 3);

	let cmd = -1;
	for(let i = 0; i < 3; ++i, py += bh + sep){
		px = (g_inf.obj.width - bw) / 2;
		if((x >= px) && (x <= (px + bw)) && (y >= py) && (y <= (py + bh))){
			cmd = i;
			break;
		}
	}
	return cmd;
}
