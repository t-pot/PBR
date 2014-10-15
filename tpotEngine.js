var SHADER_TYPE = {
    CONST: 0,
    DIFFUSE: 1,
    PHONG: 2,
    TONEMAP: 3,
}

var tpotEngine = function(){

	var screen_size = [640, 480];

    var create_shader = function(id, gl)
    {
		var shader;
		var scriptElement = document.getElementById(id);
		
		if(!scriptElement){return;}
		
		switch(scriptElement.type){
			
			case 'x-shader/x-vertex':
				shader = gl.createShader(gl.VERTEX_SHADER);
				break;
				
			case 'x-shader/x-fragment':
				shader = gl.createShader(gl.FRAGMENT_SHADER);
				break;
			default :
				return;
		}
		
		gl.shaderSource(shader, scriptElement.text);
		gl.compileShader(shader);
		
		if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
			alert(gl.getShaderInfoLog(shader));
		}

		return shader;
    }
    
    var create_program = function(vs, fs, gl){
		var program = gl.createProgram();
		
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		
		if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
			alert(gl.getProgramInfoLog(program));
		}

		gl.useProgram(program);
		return program;
    }
	return {
	    getContext: function(width, height)
	    {
		    var c = document.getElementById('canvas');
		    c.width = screen_size[0] = width;
		    c.height = screen_size[1] = height;

		    return c.getContext('webgl') || c.getContext('experimental-webgl');
	    },

	    get_program: function(shader_type, gl)
	    {
			var vs, fs;
			
			switch(shader_type){
				
				case SHADER_TYPE.CONST:
					vs = create_shader('Const_vs', gl);
					fs = create_shader('Const_fs', gl);
					break;
					
				case SHADER_TYPE.DIFFUSE:
					vs = create_shader('Diffuse_vs', gl);
					fs = create_shader('Diffuse_fs', gl);
					break;

				case SHADER_TYPE.PHONG:
					vs = create_shader('Phong_vs', gl);
					fs = create_shader('Phong_fs', gl);
					break;

				case SHADER_TYPE.TONEMAP:
					vs = create_shader('Tonemap_vs', gl);
					fs = create_shader('Tonemapt_fs', gl);
					break;

				default :
					return;
			}
		    
		    return create_program(vs, fs, gl);
	    },

	    create_vbo: function(data, gl){
			var vbo = gl.createBuffer();
			
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			
			return vbo;
	    },

	    create_ibo: function(data, gl){
			var ibo = gl.createBuffer();
			
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
			
			return ibo;
	    },

	    create_framebuffer: function(width, height, gl){
	    	if(width == 0){
		    	width = screen_size[0];
		    	height = screen_size[1];
	    	}
	    
			var frameBuffer = gl.createFramebuffer();
			gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
			
			// 深度バッファ用レンダーバッファの生成とバインド
			var depthRenderBuffer = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderBuffer);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderBuffer);
			
			// フレームバッファ用テクスチャの生成
			var fTexture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, fTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fTexture, 0);
			
			gl.bindTexture(gl.TEXTURE_2D, null);
			gl.bindRenderbuffer(gl.RENDERBUFFER, null);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			
			return {f : frameBuffer, d : depthRenderBuffer, t : fTexture};
		},
	    
		set_attribute: function(vbo, gl, prg, shader_type){

			gl.useProgram(prg);
			
			var attLocation, attStride, StrideSum;
			switch(shader_type){
				
				case SHADER_TYPE.CONST:
					attLocation = new Array(2);
					attLocation[0] = gl.getAttribLocation(prg, 'position');
					attLocation[1] = gl.getAttribLocation(prg, 'color');
					
					attStride = new Array(2);
					attStride[0] = 3;
					attStride[1] = 4;
					
					StrideSum = 4 * (3 + 4);
					break;
					
				case SHADER_TYPE.DIFFUSE:
					attLocation = new Array(3);
					attLocation[0] = gl.getAttribLocation(prg, 'position');
					attLocation[1] = gl.getAttribLocation(prg, 'normal');
					attLocation[2] = gl.getAttribLocation(prg, 'uv');
					
					attStride = new Array(3);
					attStride[0] = 3;
					attStride[1] = 3;
					attStride[2] = 2;

					StrideSum = 4 * (3 + 3 + 2);
					break;

				case SHADER_TYPE.PHONG:
					attLocation = new Array(3);
					attLocation[0] = gl.getAttribLocation(prg, 'position');
					attLocation[1] = gl.getAttribLocation(prg, 'normal');
					attLocation[2] = gl.getAttribLocation(prg, 'uv');
					
					attStride = new Array(3);
					attStride[0] = 3;
					attStride[1] = 3;
					attStride[2] = 2;

					StrideSum = 4 * (3 + 3 + 2);
					break;

				case SHADER_TYPE.TONEMAP:
					attLocation = new Array(2);
					attLocation[0] = gl.getAttribLocation(prg, 'position');
					attLocation[1] = gl.getAttribLocation(prg, 'uv');
					
					attStride = new Array(2);
					attStride[0] = 3;
					attStride[1] = 2;

					StrideSum = 4 * (3 + 2);
					break;

				default :
					return;
			}

			gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

			var offset_attS = 0;
			for(var i in attLocation){
				gl.enableVertexAttribArray(attLocation[i]);
				gl.vertexAttribPointer(attLocation[i], attStride[i], gl.FLOAT, false, StrideSum, 4 * offset_attS);
				offset_attS += attStride[i];
			}
		},
		
		createTexture: function(filename, gl)
		{
            var tex = gl.createTexture();
            tex.image = new Image();

	        tex.image.onload = function(){
	            gl.bindTexture(gl.TEXTURE_2D, tex);
	            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
			    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	            gl.generateMipmap(gl.TEXTURE_2D);
	            gl.bindTexture(gl.TEXTURE_2D, null);
	            texture = tex;
	        };
	        
	        tex.image.src = filename;
	        
	        return tex;
		},
		
		screen_width: function(){return screen_size[0];},
		screen_height: function(){return screen_size[1];}
	};
}();

