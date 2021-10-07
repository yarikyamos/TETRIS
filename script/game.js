/* 
    автор(с): Ярослав Мосорук
              JavaScript ES6 HTML5
*/
const COLS   = 18;
const ROWS   = 23;
const C_NONE = 0;
const COLORS = ["rgba(255,10,0,0.04)","#FFFF00","#3376BB","#55DDFF"];
let   C_MUL  = 0;
const CONTROL= {LEFT:0, RIGHT:1, ROTATE:2, DOWN:3, NOT:4};
const STATE  = {TITLE:0, PLAY:1, OVER:2, PAUSE:3};
let g_velocity = 0.3;
let g_size   = 0;
let g_edge   = 0;
let g_mid    = 0;
let g_blocks = null;
let g_field  = null;
let g_figure = null;
let g_ftemp  = null;
let g_fnext  = null;
let g_prc    = {left:0, top:0, width:0, height:0};
let g_left   = 0;
let g_top    = 0;
let g_move   = CONTROL.NOT;
let g_to_left= 0;
let g_fcount = 0;
let g_row1   = -1;
let g_row2   = -1;
let g_timeout= 0;
let g_n_hdc = null;
let g_n_can = null;
let g_inext = 0;
let g_tlevel= null;
let g_tlines= null;
let g_level = 0;
let g_lines = 0;
let g_direct= null;
let g_back  = null;
let g_state = -1;
let g_main  = null;
let g_dirs  = null;
let g_push  = null;
let g_speed = 0.0;
let g_ivel  = 0;
let g_snd_r = null;
let g_snd_i = null;
let g_snd_k = null;
let g_n_res = 6;


//класс-игры
class game {
	//загрузка
	static load(){
		g_main  = obj_at("field");
		g_direct= obj_at("direct");
		g_size  = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.04);
		g_edge  = Math.floor(g_size * 0.2);
		g_mid   = Math.floor(g_size * 0.5);
		C_MUL   = 1.0 / g_size;
		let obj = obj_at("hdc");

		obj.width  = g_size * COLS;
		obj.height = g_size * ROWS;

		canvas.create(obj, obj.width, obj.height);

		show_main();

		g_inf.hdc.fillStyle = "#FF0000";
		g_inf.hdc.fillRect(0, Math.floor(obj.height/2)-g_size, obj.width, g_size);

		g_lines = 0;
		const pbar = () => {
			++g_lines;
			g_inf.hdc.fillStyle = "#77BBFF";
			g_inf.hdc.fillRect(0, Math.floor(g_inf.obj.height/2)-g_size, g_inf.obj.width / g_n_res * g_lines, g_size);
			if(g_lines == g_n_res)
				game.create();
		}

		try {
			g_snd_r  = new Audio("sound/rotate.wav");
			g_snd_i  = new Audio("sound/put.wav");
			g_snd_k  = new Audio("sound/erase.wav");
			g_n_res += 3;
			g_snd_r.addEventListener("loadeddata", pbar, false);
			g_snd_i.addEventListener("loadeddata", pbar, false);
			g_snd_k.addEventListener("loadeddata", pbar, false);
		} catch(e){}

		g_blocks = new cimage("image/blocks.png", g_size * 7, g_size * 2, pbar);
		g_back   = new Image();
		g_back.src = "image/back.jpg";
		g_back.addEventListener("load", pbar);

		const resize = (o, s, fun) => {
			let p = Math.floor(s) + "px";
			o.style.width  = p;
			o.style.height = p;
			o.src = "image/" + o.id + ".png";
			o.addEventListener("load", fun);
		}
		g_dirs = new Array(4);
		g_push = new Array(4);

		const   m = g_size * 2;
		const ids = ["left", "right", "rotate", "down"];
		let cur;
		for(let i = 0; i < ids.length; ++i){
			cur = obj_at(ids[i]);
			resize(cur, m, pbar);
			g_dirs[i] = cur;
			g_push[i] = false;
		}
		dirs_events(game.control_down, game.control_up);
	}


	//создание
	static create(){
		g_velocity = g_edge * 0.085;
		g_level  = 0;
		g_state  = STATE.TITLE;
		g_field  = new matrix(ROWS, COLS);
		g_figure = new matrix(4, 4);
		g_ftemp  = new matrix(4, 4);
		g_fnext  = new matrix(4, 4);
		g_fcount = figures_count();

		g_n_can = obj_at("figure");
		g_n_can.width  = Math.floor(g_inf.obj.width * 0.24);
		g_n_can.height = g_n_can.width; 
		g_n_hdc = g_n_can.getContext("2d");

		let back    = obj_at("background");
		back.width  = g_inf.obj.width;
		back.height = g_inf.obj.height;
		
		let hdc = back.getContext("2d", {alpha:false});
		fillCanvas(hdc, 0, 0, back.width, back.height, g_back, 0, 0, g_back.width, g_back.height);
		hdc.strokeStyle = "#111133";
		hdc.lineWidth   = 1;
		hdc.beginPath();
		for(let i = 1; i < COLS; ++i){
			hdc.moveTo(i * g_size, 0);
			hdc.lineTo(i * g_size, back.height);
		}
		hdc.stroke();

		canvas.delay = 10;
		canvas.eventPaint   = game.on_draw;
		canvas.eventUpdate  = game.on_update;
		canvas.eventClick   = game.on_click;
		canvas.eventKeyDownUp(game.on_keydown, game.on_keyup);
		window.focus();	

		let tab = obj_at("panel");
		tab.style.width  = Math.floor(g_inf.obj.width * 0.3) + "px";
		tab.style.height = g_inf.obj.height + "px";

		let fh = Math.floor(g_mid) + "px";
		obj_at("next").style.fontSize = fh;

		g_tlevel = obj_at("level");
		g_tlines = obj_at("lines");
		g_tlevel.style.fontSize = fh;
		g_tlines.style.fontSize = fh;

		const fbar = (o, s) => {
			o.style.fontSize = s;

			const push = (e) => {
				if(e.target)
					e.target.style.backgroundColor = "#00FF44";				
			}

			const hide = (e) => {
				if(e.target)
					e.target.style.backgroundColor = "#BFDFFF";
			}

			if(typeof(o.ontouchstart) != "undefined"){
				o.ontouchstart = push;
				o.ontouchend = hide;
			} else {
				o.onmousedown = push;
				o.onmouseup = hide;
			}
		}

		fh = Math.floor(g_mid * 0.9) + "px";
		fbar(obj_at("pause"), fh);
		fbar(obj_at("close"), fh);
		show_menu();
	}


	//инициализация
	static initialize(){
		g_state      = STATE.PLAY;
		g_speed      = g_velocity;
		g_row1       = g_row2 = -1;
		g_timeout    = 0;
		g_inext      = -1;
		g_lines      = 0;
		g_field.fill = C_NONE;
		g_prc.left   = g_prc.top = 0;

		const m = 5 + g_level % 5;
		const t = 1 + ((Math.random() * 7) >>> 0);
		for(let i = 0; i < m; ++i){
			let col = (Math.random() * g_field.cols) >>> 0;
			for(let j = 0; j < g_field.cols; ++j){
				if(j != col) 
					g_field.setAt(g_field.rows - 1 - i, j, t);
			}
		}

		game.new_figure();
		text_level(g_level);
		text_lines(g_lines); 
		g_inf.hdc.clearRect(0, 0, g_inf.obj.width, g_inf.obj.height);
	}


	//обновление
	static on_update(time, delta){
		if(g_state == STATE.OVER)
			return;

		g_prc.left = g_left;
		g_prc.top  = g_top;

		if(g_push[CONTROL.LEFT])
			game.move_horz(true);
		else if(g_push[CONTROL.RIGHT])
			game.move_horz(false);

		switch(g_move){
		case CONTROL.LEFT:
			g_left -= Math.ceil(delta * (g_edge * 0.33));
			if(g_left <= g_to_left){
				g_left = g_to_left;
				g_move = CONTROL.NOT;
				if(g_push[CONTROL.LEFT])
					game.move_horz(true);
			}
			figure_dirty();
			break;
		case CONTROL.RIGHT:
			g_left += Math.ceil(delta * (g_edge * 0.33));
			if(g_left >= g_to_left){
				g_left = g_to_left;
				g_move = CONTROL.NOT;
				if(g_push[CONTROL.RIGHT])
					game.move_horz(false);
			}
			figure_dirty();
			break;
		case CONTROL.ROTATE:
			g_ftemp.copy_transponse(g_figure);
			g_ftemp.reverse_vert();	
			if(figure_is_rotate(g_ftemp, Math.floor(g_left * C_MUL), g_top)){
				if(!g_figure.compare(g_ftemp)){
					figure_erase(g_figure, g_left, g_top);
					sound_play(g_snd_r);
				}
				g_figure.copy(g_ftemp);
			}
			g_move = CONTROL.NOT;
			break;
		default:	
			game.move_down(delta * g_speed, time);
			break;
		}

		if(g_row1 != -1){
			if(time > g_timeout){
				game.remove_rows();
				game.select_lines(time);

				//проверить на победу
				const N = g_field.rows - 1;
				let c = 0;
				while((c < g_field.cols) && (g_field.getAt(N, c) == C_NONE))
					++c;

				if(c == g_field.cols){
					++g_level;
					game.initialize();
				}
			}
		}
	}


	//вывод
	static on_draw(hdc){
		if(g_state == STATE.OVER)
			return;

		let c, r, id;
		figure_erase(g_figure, g_prc.left, g_prc.top);

		for(let i = 0; i < g_figure.rows; ++i){
			for(let j = 0; j < g_figure.cols; ++j){
				id = g_figure.getAt(i, j);
				if(id != C_NONE)
					hdc.drawImage(g_blocks.handle, (id - 1) * g_size, 0, g_size, g_size, g_left + j * g_size, g_top + i * g_size, g_size, g_size);
			}
		}

		//вывод фигур
		for(let i = 0; i < g_field.rows; ++i){
			for(let j = 0; j < g_field.cols; ++j){
				id = g_field.getAt(i, j);
				if((id != C_NONE) && ((id & 0x10) == 0)){
					hdc.drawImage(g_blocks.handle, (id - 1) * g_size, g_size, g_size, g_size, j * g_size, i * g_size, g_size, g_size);
					g_field.setAt(i, j, id | 0x10);
				}
			}
		}

		//отметить выделенное
		if(g_row1 != -1){
			hdc.fillStyle = COLORS[0];
			hdc.fillRect(0, g_row1 * g_size, g_inf.obj.width, (g_row2 - g_row1) * g_size);
		}

		//проверка на проигрыш
		c = 0;
		while((c < g_field.cols) && (g_field.getAt(0, c) == C_NONE))
			++c;

		if(c != g_field.cols){ //вы проиграли
			show_game_over();
			g_state = STATE.OVER;
		}
	}


	//управление клавиатурой
	static on_keydown(key){
		if(g_state != STATE.PLAY)
			return;

		switch(key){
		case 38: //вверх
		case 87:
		case 119:
		case 1094:
		case 1062:
			if(g_move == CONTROL.NOT){
				g_move = CONTROL.ROTATE;
				g_push[g_move] = true;
			}
			break;
		case 37: //влево
		case 65:
		case 97:
		case 1092:
		case 1060:
			g_push[CONTROL.LEFT] = true;
			break;
		case 39: //вправо
		case 68:
		case 100:
		case 1074:
		case 1042:
			g_push[CONTROL.RIGHT] = true;
			break;
		case 40: //вниз
		case 83:
		case 1099:
		case 1067:
		case 115:
			g_push[CONTROL.DOWN] = true;
			g_speed = g_edge;
			break;
		}
	}

	static on_keyup(key){
		if(g_state != STATE.PLAY)
			return;

		switch(key){
		case 37: //влево
		case 65:
		case 97:
		case 1092:
		case 1060:
			g_push[CONTROL.LEFT] = false;
			break;
		case 39: //вправо
		case 68:
		case 100:
		case 1074:
		case 1042:
			g_push[CONTROL.RIGHT] = false;
			break;
		case 40: //вниз
		case 83:
		case 1099:
		case 1067:
		case 115:
			g_push[CONTROL.DOWN] = false;
			break;
		}
		g_speed = g_velocity;			
	}


	//нажатие
	static control_down(target){
		if(g_state != STATE.PLAY)
			return;

		const inx = dirs_find(g_dirs, target);
		if(inx != -1)
			target.style.borderColor = COLORS[1];

		switch(inx){
		case CONTROL.LEFT:
			g_push[inx] = true;
			break;
		case CONTROL.RIGHT:
			g_push[inx] = true;
			break;
		case CONTROL.DOWN:
			g_speed = g_edge;
			g_push[inx] = true;
			break;
		case CONTROL.ROTATE:
			if(g_move == CONTROL.NOT){
				g_move = CONTROL.ROTATE;
				g_push[inx] = true;
			}
			break;
		}
	}


	//отжатие
	static control_up(target){
		if(g_state != STATE.PLAY)
			return;

		const inx = dirs_find(g_dirs, target);
		if(inx != -1){
			target.style.borderColor = COLORS[3];
			g_push[inx] = false;
		} else {
			for(let i = 0; i < g_dirs.length; ++i){
				if(g_push[i])
					g_dirs[i].style.borderColor = COLORS[3];
				g_push[i] = false;	
			}
		}
		g_speed = g_velocity;
	}


	//движение влево/вправо
	static move_horz(left){
		if(g_move != CONTROL.NOT)
			return;

		let col = Math.floor(g_left * C_MUL);
		if(left){
			if(figure_move_horz(col - 1, g_top)){
				g_move    = CONTROL.LEFT;
				g_to_left = g_left - g_size;
			}
		} else {
			if(figure_move_horz(col + 1, g_top)){
				g_move    = CONTROL.RIGHT;
				g_to_left = g_left + g_size;
			}
		}
	}

	//движение вниз
	static move_down(vel, time){
		vel = Math.ceil(vel);
		if(vel > g_edge)
			vel = g_edge;
		const col = Math.floor(g_left * C_MUL);

		if(figure_move_down(col, g_top + vel))
			g_top += vel;
		else {
			sound_play(g_snd_i);
			figure_put(Math.floor(g_top * C_MUL), col);
			game.new_figure();
			this.select_lines(time);
		}
	}

	//новая фигура
	static new_figure(){
		if(g_inext == -1){
			let inx = (Math.random() * g_fcount) >>> 0;
			figures_get(g_figure, inx);

			do {
				g_inext = (Math.random() * g_fcount) >>> 0;
			} while(g_inext == inx);

			figures_get(g_fnext, g_inext);
		} else {
			g_figure.copy(g_fnext);

			g_inext = (Math.random() * g_fcount) >>> 0;
			figures_get(g_fnext, g_inext);

			if(((Math.random() * 2) >>> 0) < 1)
				g_fnext.transponse();
		}

		g_left = g_size + Math.floor(Math.random() * (g_field.cols - g_figure.cols - 1)) * g_size;
		g_top  = -g_figure.rows * g_size;

		//следующея фигура
		const size = g_mid + g_mid*0.2;
		figure_size(g_fnext, g_prc, size);

		const left = ((g_n_can.width  - g_prc.width)  / 2) - g_prc.left;
		const top  = ((g_n_can.height - g_prc.height) / 2) - g_prc.top;

		g_n_hdc.fillStyle   = COLORS[2];
		g_n_hdc.strokeStyle = COLORS[3];
		g_n_hdc.clearRect(0, 0, g_n_can.width, g_n_can.height);

		let x, y;
		for(let i = 0; i < g_fnext.rows; ++i){
			for(let j = 0; j < g_fnext.cols; ++j){
				if(g_fnext.getAt(i, j) != C_NONE){
					x = left + j * size;
					y = top  + i * size;
					g_n_hdc.fillRect(x, y, size, size);
					g_n_hdc.strokeRect(x + 1, y + 1, size - 2, size - 2);
				}
			}
		}		
		
	}

	//проверка на линии - убавлений
	static select_lines(time){
		g_timeout = 0;
		g_row1 = g_row2 = -1;

		let j, i = 0;
		while(i < g_field.rows){
			j = 0;
			while((j < g_field.cols) && (g_field.getAt(i, j) != C_NONE))
				++j;

			if(j == g_field.cols){
				g_row1 = i;
				g_row2 = i + 1;
				break;
			}
			++i;
		}

		if(i == g_field.rows)
			return;

		i = g_row2;
		while(i < g_field.rows){
			j = 0;
			while((j < g_field.cols) && (g_field.getAt(i, j) != C_NONE))
				++j;

			if(j == g_field.cols){
				g_row2 = ++i;
				continue;
			}
			break;
		}
		g_timeout = time + 400;
	}

	//удаление пустых строк игрового поля
	static remove_rows(){
		let p, row = 0;
		while(row < g_row2){
			p = 0;
			while((p < g_field.cols) && (g_field.getAt(row, p) == C_NONE))
				++p;

			if(p != g_field.cols)
				break;
			++row;
		}

		//стереть прямоугольник
		g_inf.hdc.clearRect(0, row * g_size, g_inf.obj.width, (g_row2 - row) * g_size);
		for(let id = 0; row < g_row2; ++row){
			for(p = 0; p < g_field.cols; ++p){
				if((id = g_field.getAt(row, p)) != C_NONE)
					g_field.setAt(row, p, id & ~(1 << 4));
			}
		}

		const n = g_row2 - g_row1;
		for(let i = g_row2 - 1; i > n; --i){
			for(let j = 0; j < g_field.cols; ++j)
				g_field.setAt(i, j, g_field.getAt(i - n, j));
		}

		for(let i = 0; i < n; ++i){
			for(let j = 0; j < g_field.cols; ++j)
				g_field.setAt(i, j, C_NONE);
		}
		g_lines += n;
		text_lines(g_lines);
		sound_play(g_snd_k);
	}


	static control_pause(obj){
		if(g_state == STATE.PAUSE){
			g_state = STATE.PLAY;
			canvas.run();
			set_text(obj, "Пауза");
		} else if(g_state == STATE.PLAY){
			g_state = STATE.PAUSE;
			canvas.stop();
			set_text(obj, "Продолжить");
		}
	}

	static control_abort(){
		g_state = STATE.TITLE;
		canvas.stop();
		set_visible(g_direct, false);
		show_menu();
		show_main();
		set_text(obj_at("pause"), "Пауза");
	}

	//нажатие
	static on_click(e){
		switch(g_state){
		case STATE.TITLE:
			switch( command_get(e.offsetX, e.offsetY) ){
			case 0: //начать играть
				show_game();
				game.initialize();
				canvas.run();
				break;
			case 1:
				show_help();
				break;
			case 2:
				{
					let p = prompt("Изменить скорость падения(максимально до 10)", g_ivel);
					if((p != null) && !isNaN(p)){
						g_ivel     = Math.max(Math.min(p, 10), 0);
						g_velocity = g_edge * 0.085 + g_ivel * 0.1;
					}
				}
				break;
			}
			break;
		case STATE.OVER:
			game.initialize();
			break;
		}
	}
}


//движение по горизонтали
const figure_move_horz = (col, top) => {
	let top0 = top + (g_size - g_edge);
	let r, c, p;
	for(let i = 0; i < g_figure.rows; ++i){
		for(let j = 0; j < g_figure.cols; ++j){
			if(g_figure.getAt(i, j) == C_NONE)
				continue;

			c = col + j;
			if((c < 0) || (c >= g_field.cols))
				return false;

			p = i * g_size;
			r = Math.floor((top0 + p) * C_MUL);
			if(r < 0)
				continue;
			else if((r >= g_field.rows) || (g_field.getAt(r, c) != C_NONE))
				return false;

			r = Math.floor((top + p) * C_MUL);
			if(r < 0)
				continue;
			else if((r >= g_field.rows) || (g_field.getAt(r, c) != C_NONE))
				return false;
		}
	}
	return true;
}


//проверка на движение вниз
const figure_move_down = (col, top) => {
	let r, c;
	top += g_size - g_edge;

	for(let i = 0; i < g_figure.rows; ++i){
		for(let j = 0; j < g_figure.cols; ++j){
			if(g_figure.getAt(i, j) == C_NONE)
				continue;

			c = col + j;
			if((c < 0) || (c >= g_field.cols))
				continue;

			r = Math.floor((top + i * g_size) * C_MUL);
			if(r < 0)
				continue;
			else if((r >= g_field.rows) || (g_field.getAt(r, c) != C_NONE))
				return false;
		}
	}
	return true;
}


//вставка в поле фигуры
const figure_put = (row, col) => {
	let r, c, id;
	for(let i = 0; i < g_figure.rows; ++i){
		for(let j = 0; j < g_figure.cols; ++j){
			if(g_figure.getAt(i, j) != C_NONE){
				r = row + i;
				c = col + j;
				if((r >= 0) && (c >= 0) && (r < g_field.rows) && (c < g_field.cols)){
					g_field.setAt(r, c, g_figure.getAt(i, j));
					if(++r < g_field.rows){
						id = g_field.getAt(r, c);
						if(id != C_NONE)
							g_field.setAt(r, c, id & ~(1 << 4));
						else
							g_inf.hdc.clearRect(c * g_size, r * g_size, g_size, g_size);
					}
				}
			}
		}
	}
}


//проверка на вращение фигуры
const figure_is_rotate = (fig, col, top) => {
	let r, c, p;
	let top0 = top + (g_size - g_edge);

	for(let i = 0; i < fig.rows; ++i){
		for(let j = 0; j < fig.cols; ++j){
			if(fig.getAt(i, j) == C_NONE)
				continue;

			p = i * g_size;
			r = Math.floor((top0 + p) * C_MUL);
			c = col + j;
			if(r < 0)
				continue;
			else if((c < 0) || (c >= g_field.cols) || (r >= g_field.rows) || (g_field.getAt(r, c) != C_NONE))
				return false;

			r = Math.floor((top + p) * C_MUL);
			if(r < 0)
				continue;
			else if((r >= g_field.rows) || (g_field.getAt(r, c) != C_NONE))
				return false;
		}
	}
	return true;
}


//убираем артефакты
const figure_dirty = () => {
	const top  = g_top + g_size + g_edge;
	const col1 = Math.floor(g_left * C_MUL);
	const col2 = Math.floor((g_left + g_size) * C_MUL);
	let r, c, id;
	for(let i = 0; i < g_figure.rows; ++i){
		for(let j = 0; j < g_figure.cols; ++j){
			if(g_figure.getAt(i, j) == C_NONE)
				continue;

			r = Math.round((top + i * g_size) * C_MUL);
			if((r < 0) || (r >= g_field.rows))
				continue;

			c = col1 + j;
			if((c < 0) || (c >= g_field.cols))
				continue;
			else if((id = g_field.getAt(r, c)) != C_NONE)
				g_field.setAt(r, c, id & ~(1 << 4));

			c = col2 + j;
			if((c < 0) || (c >= g_field.cols))
				continue;
			else if((id = g_field.getAt(r, c)) != C_NONE)
				g_field.setAt(r, c, id & ~(1 << 4));
		}
	}	
}


const figure_erase = (fig, left, top) => {
	for(let i = 0; i < fig.rows; ++i){
		for(let j = 0; j < fig.cols; ++j){
			if(fig.getAt(i, j) != C_NONE)
				g_inf.hdc.clearRect(left + j * g_size, top + i * g_size, g_size, g_size);
		}
	}
}


//показ только игрового окна
const show_main = () => {
	set_visible(g_direct, false);
	g_main.style.left = Math.round((window.innerWidth  - g_inf.obj.width) /2) + "px";
	g_main.style.top  = Math.round((window.innerHeight - g_inf.obj.height)/2) + "px";
}


//показ игрового окна и панели управления
const show_game = () => {
	set_visible(g_direct, true);
	const w = Math.floor(g_inf.obj.width * 0.3);
	const x = Math.round((window.innerWidth - (g_inf.obj.width + w)) /2);
	g_main.style.left   = x + "px";
	g_direct.style.left = (x + g_inf.obj.width) + "px";
	g_direct.style.top  = g_main.style.top;
}


const text_level = (n) => {
	set_text(g_tlevel, "Уровень - " + (n + 1));
}

const text_lines = (n) => {
	set_text(g_tlines, "Линий - " + n);
}
