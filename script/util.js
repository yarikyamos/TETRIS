/* 
    автор(с): Ярослав Мосорук
              JavaScript ES6 HTML5
*/

const FONT_FACE = "px Georgia,Verdana,Arial,Helvetica,Sans-serif,Tahoma";
const FIGURES   = "1,1010,1011,0111,1111,110011000,011110000,010010011,010010110,010111000,010010010,101101111,100100111,001001111,0100011001100000,0010011001100000,0000111101100000,0000000011110000,0000111111110000";

const obj_at = (id) => {
	return (document.getElementById) ? document.getElementById(id) : document.all[id];
}

const set_text = (obj, s) => {
	if(obj.innerText)
		obj.innerText = s;
	else
		obj.innerHTML = s;
}

const set_visible = (obj, show) => {
	obj.style.display = (show) ? "block" : "none";
}

const chr_bit = (c) => {
	return ((c == '0') || (c == '1'));
}


//кол-во фигур
function figures_count(){
	let i = 0, k = 0, g = false;
	do {
		if((i < FIGURES.length) && chr_bit(FIGURES.charAt(i)))
			g = true;
		else if(g){
			++k;
			g = false;
		}
	} while(i++ < FIGURES.length);
	return k;
}


//получить фигуру
function figures_get(figure, index){
	const id = 1 + ((Math.random() * 7) >>> 0);
	let m, j = 0, n = FIGURES.length;
	for(let i = 0; i < n; i = j){
		j = i;
		while((j < n) && chr_bit(FIGURES.charAt(j)))
			++j;

		if(index-- == 0){
			figure.fill = 0;
			m = Math.sqrt(j - i) >>> 0;
			figure.setSize(m, m);

			for(let k = 0; i < j; ++i, ++k)
				figure.setValue(k, (FIGURES.charAt(i) == '0') ? 0 : id);
			break;
		}

		if((j < n) && (FIGURES.charAt(j) == ','))
			++j;
		else
			break;
	}
}


//размер фигуры без пустых клеток
function figure_size(figure, prc, size){
	let left = -1, top = -1, right = -1, bottom = -1;
	for(let i = 0; i < figure.rows; ++i){
		for(let j = 0; j < figure.cols; ++j){
			if(figure.getAt(i, j) == 0)
				continue;

			if((left == -1) || (left > j))
				left = j;
			if((right == -1) || (right < j))
				right = j;

			if((top == -1) || (top > i))
				top = i;
			if((bottom == -1) || (bottom < i))
				bottom = i;
		}
	}
	prc.left   = left * size;
	prc.top    = top * size;
	prc.width  = (right - left + 1) * size;
	prc.height = (bottom - top + 1) * size;
}


//заливка холста тайлом
function fillCanvas(hdc, px, py, width, height, img, ox, oy, w, h){
	let mx = width  % w;
	let my = height % h;

	width  += px;
	height += py;
	let cx = width;
	let cy = height;

	if(mx > 0)
		cx -= w;
	if(my > 0)
		cy -= h;

	let x, y = py;
	for(; y < cy; y += h){
		x = px;
		for(; x < cx; x += w)
			hdc.drawImage(img, ox, oy, w, h, x, y, w, h);

		if(x < width)
			hdc.drawImage(img, ox, oy, mx, h, x, y, mx, h);
	}

	if(y < height){
		for(x = px; x < cx; x += w)
			hdc.drawImage(img, ox, oy, w, my, x, y, w, my);

		if(x < width)
			hdc.drawImage(img, ox, oy, mx, my, x, y, mx, my);
	}
}


//матрица 8-бит(фиксированная без динамического роста)
class matrix {
	constructor(_rows, _cols){
		this.irows = _rows;
		this.icols = _cols;
		this.arr   = new Uint8Array(_rows * _cols);
		this.fill  = 0;
	}

	setAt(r, c, v){
		this.arr[r * this.icols + c] = v;
	}

	getAt(r, c){
		return this.arr[r * this.icols + c];
	}

	set fill(v){
		for(let i = 0; i < this.arr.length; ++i)
			this.arr[i] = v;
	}

	get rows(){
		return this.irows;
	}

	get cols(){
		return this.icols;
	}

	set rows(n){
		if(this.arr.length >= (n * this.icol))
			this.irows = n;
	}

	set cols(n){
		if(this.arr.length >= (n * this.irow))
			this.icols = n;
	}

	setValue(i, v){
		this.arr[i] = v;
	}

	setSize(_rows, _cols){
		if(this.arr.length >= (_rows * _cols)){
			this.irows = _rows;
			this.icols = _cols;
		}
	}

	copy_transponse(mat){
		this.fill  = 0;
		this.irows = mat.cols;
		this.icols = mat.rows;
		for(let i = 0; i < mat.rows; ++i){
			for(let j = 0; j < mat.cols; ++j)
				this.setAt(j, i, mat.getAt(i, j));
		}
	}

	transponse(){
		if(this.irows != this.icols)
			return;
		let t;
		for(let i = 0; i < this.irows; ++i){
			for(let j = i; j < this.icols; ++j){
				t = this.getAt(i, j);
				this.setAt(i, j, this.getAt(j, i));
				this.setAt(j, i, t);
			}
		}	
	}

	copy(mat){
		this.irows = mat.rows;
		this.icols = mat.cols;
		for(let i = 0; i < mat.arr.length; ++i)
			this.arr[i] = mat.arr[i];
	}

	reverse_horz(){
		let v, i  = 0;
		for(let j = this.icols - 1; i < j; ++i, --j){
			for(let r = 0; r < this.irows; ++r){
				v = this.getAt(r, i);
				this.setAt(r, i, this.getAt(r, j));
				this.setAt(r, j, v);
			}
		}
	}

	reverse_vert(){
		let v, i  = 0;
		for(let j = this.irows - 1; i < j; ++i, --j){
			for(let c = 0; c < this.icols; ++c){
				v = this.getAt(i, c);
				this.setAt(i, c, this.getAt(j, c));
				this.setAt(j, c, v);
			}
		}
	}

	compare(mat){
		if((mat.cols != this.icols) || (mat.rows != this.irows))
			return false;

		for(let i = 0; i < this.arr.length; ++i){
			if(this.arr[i] != mat.arr[i])
				return false;
		}
		return true;
	}
}


//холст-изображение
class cimage {
	constructor(filename, cx, cy, fun){
		this.load    = false;
		this.can     = null;
		this.img     = new Image();
		this.img.src = filename;
		this.img.addEventListener("load", () => {
			this.can = document.createElement("canvas");
			this.can.width  = cx;
			this.can.height = cy;
			
			let hdc = this.can.getContext("2d", {alpha:false});
			hdc.drawImage(this.img, 0, 0, parseInt(this.img.width), parseInt(this.img.height), 0, 0, cx, cy);

			this.img.src = "";
			delete this.img;
			this.img = null;
			hdc = null;
			this.load = true;
			fun();
		});
	}

	get width(){
		return this.can.width;
	}

	get height(){
		return this.can.height;
	}

	get handle(){
		return this.can;
	}

	get complete(){
		return this.load;
	}
}


//события(кнопок управление)
function dirs_events(down, up){
	const a = (e) => down(e.target);
	const b = (e) => up(e.target);

	if(typeof(window.onpointerdown) != "undefined"){
		window.onpointerdown = a;
		window.onpointerup   = b;
		window.onpointercancel = b;
	} else {
		window.onmousedown = a;
		window.onmouseup   = b;
		window.onmouseout  = b;
	}
}


function dirs_find(arr, obj){
	for(let i = 0; i < arr.length; ++i){
		if(arr[i] == obj)
			return i;
	}
	return -1;
}


function sound_play(s){
	try {
		s.play();
	} catch(e){

	}
}