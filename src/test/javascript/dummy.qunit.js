define(["jquery", "dummy"], function($, dummy){

	test("finds the body element", function(){
		// when
		var body = $("body");
		
		// then
		equal(body.length, 1);
	});

    test("dummy tells the time", function(){
        // when
        var time = dummy.getTime();

        // then
        ok(time);
    });
	
});
