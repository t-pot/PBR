onload = function(){

    var eMetallic = document.getElementById('metallic');
    var eRoughness = document.getElementById('roughness');
    var eFresnel = document.getElementById('fresnel');

    
    var gl = tpotEngine.getContext(512, 512);
    
    // プログラムオブジェクトの生成とリンク
    var prg = tpotEngine.get_program(SHADER_TYPE.PHONG, gl);
    
	// VBOの生成
	var vbo = tpotEngine.create_vbo(
		teapot_vtx_xnt, 
		gl);
	var ibo = tpotEngine.create_ibo(
		teapot_index, 
		gl);
	
	var tex = tpotEngine.createTexture('t-pot.png', gl);
	
	// uniformLocationの取得
	var uniLocation = new Array();
	uniLocation[0] = gl.getUniformLocation(prg, 'mvpMatrix');
	uniLocation[1] = gl.getUniformLocation(prg, 'invMatrix');
	uniLocation[2] = gl.getUniformLocation(prg, 'lightDirection');
	uniLocation[3] = gl.getUniformLocation(prg, 'eyeDirection');
	uniLocation[4] = gl.getUniformLocation(prg, 'parametes');
	uniLocation[5] = gl.getUniformLocation(prg, 'texture');

	// float texture を有効化
	var format = gl.FLOAT;
	var ext = gl.getExtension('OES_texture_float');
	if(ext == null){
		format = gl.UNSIGNED_BYTE;
		alert("OES_texture_float is not supported!");
	}
	
    var prg_tonemap = tpotEngine.get_program(SHADER_TYPE.TONEMAP, gl);
	var vbo_tonemap = tpotEngine.create_vbo(
		[-1,-1,0.5, 0,0,
		 +1,-1,0.5, 1,0,
		 -1,+1,0.5, 0,1,
		 +1,+1,0.5, 1,1], 
		gl);
	var ibo_tonemap = tpotEngine.create_ibo(
		[0,1,2, 1,3,2], 
		gl);
	var fBuffer = tpotEngine.create_framebuffer(0, 0, format, gl);
	if(fBuffer == null && format == gl.FLOAT){
		fBuffer = tpotEngine.create_framebuffer(0, 0, gl.UNSIGNED_BYTE, gl);
	}
	
	var uniLocation_tonemap = new Array();
	uniLocation_tonemap[0] = gl.getUniformLocation(prg_tonemap, 'texture');

	
	// 各種行列の生成と初期化
	var mMatrix = tpotMat.identity();
	var vMatrix = tpotMat.identity();
	var pMatrix = tpotMat.identity();
	var tmpMatrix = tpotMat.identity();
	var mvpMatrix = tpotMat.identity();
	var invMatrix = tpotMat.identity();
	
	// 平行光源の向き
	var lightDirection = [1.5, 1.0, 0.5];
	
	// 視点ベクトル
	var eyeDirection = [0.0, 1.0, 5.0];
	
	// ビュー×プロジェクション座標変換行列
	tpotMat.lookAt(eyeDirection, [1, -1, 0], [0, 1, 0], vMatrix);
	tpotMat.perspective(45, tpotEngine.screen_width() / tpotEngine.screen_height(), 0.1, 100, pMatrix);
	tpotMat.multiply(pMatrix, vMatrix, tmpMatrix);
	
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.enable(gl.CULL_FACE);
	
	// カウンタの宣言
	var frames = 0;
	
	(function(){

		// 環境光の色
		var parametes = [0.1, 0.01 * eFresnel.value, 0.01 * eRoughness.value, 0.01 * eMetallic.value ];// a成分にmetal具合を入れる
		

		gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer.f);

		gl.clearColor(0.2, 0.2, 0.8, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// frames = 150;
		var rad = (frames % 360) * Math.PI / 180;
		
		tpotEngine.set_attribute(vbo, gl, prg, SHADER_TYPE.PHONG);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		
		// uniform変数の登録
		mMatrix = tpotMat.identity();
		tpotMat.translate(mMatrix, [1.0, -1.0, 0.0], mMatrix);
		tpotMat.rotate(mMatrix, rad, [0, 1, 0], mMatrix);

		tpotMat.multiply(tmpMatrix, mMatrix, mvpMatrix);
		tpotMat.inverse(mMatrix, invMatrix);

		gl.uniformMatrix4fv(uniLocation[0], false, mvpMatrix);
		gl.uniformMatrix4fv(uniLocation[1], false, invMatrix);
		gl.uniform3fv(uniLocation[2], lightDirection);
		gl.uniform3fv(uniLocation[3], eyeDirection);
		gl.uniform4fv(uniLocation[4], parametes);
		gl.uniform1i(uniLocation[5], 0);

		gl.drawElements(gl.TRIANGLES, 3*2328, gl.UNSIGNED_SHORT, 0);
		
		// 元のフレームバッファに切り替え
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearDepth(1.0);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// 画面全体を覆うスクリーンを描く
		tpotEngine.set_attribute(vbo_tonemap, gl, prg_tonemap, SHADER_TYPE.TONEMAP);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo_tonemap);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, fBuffer.t);
		gl.uniform1i(uniLocation_tonemap[0], 0);
		
		gl.drawElements(gl.TRIANGLES, 3*2, gl.UNSIGNED_SHORT, 0);

		gl.flush();
		
		frames++;

		setTimeout(arguments.callee, 1000 / 60);
	})();
};

