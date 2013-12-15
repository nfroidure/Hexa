var effroi = effroi
  , assert = chai.assert
  , $ = document.getElementById.bind(document)
  , $$ = document.querySelectorAll.bind(document);

describe("Loading the UI", function() {

    before(function() {
        var style=document.createElement('link');
        style.setAttribute('rel','stylesheet');
        style.setAttribute('type','text/css');
        style.setAttribute('href','base/css/styles.css');
        document.head.appendChild(style);
        var script=document.createElement('script');
        script.setAttribute('src','base/javascript/script.js');
        script.setAttribute('type','text/javascript');
        document.head.appendChild(script);
        document.body.innerHTML = window.__html__['index.html']
          .replace(/^(?:[^]*)<body>([^]*)<\/body>(?:[^]*)$/mi,'$1');
    });

    after(function() {
    });

    it("should work", function(done) {
        assert.equal($$('menu').length, 1);
        setTimeout(done, 1500);
    });

});


describe("Viewing binary datas", function() {
    var ii= 5000;

    before(function() {
    });

    after(function() {
    });

    it("should be filled", function(done) {
        var typedArray = new Uint8Array(ii);
        for(var i=0; i<ii; i++) {
          typedArray[i] = (ii-i)%255;
        }
        window.postMessage(typedArray.buffer,'*');
        setTimeout(done, 500);
    });

    it("should displays bytes as expected", function() {
        var bytes = $$('td.byte a');
        for(var i=0, iii = bytes.length; i<iii; i++) {
          var t = ((ii-i)%255).toString(16);
          assert.equal(bytes[i].innerHTML, t.length<2 ? 0+t : t);
        }
    });

    it("should displays forms as expected (big endian)", function() {
        var bytes = $$('td.byte a');
        effroi.mouse.click(bytes[2]);
        assert.equal($$('input[name="uint8"]')[0].value, 153);
        assert.equal($$('input[name="int8"]')[0].value, -103);
        assert.equal($$('input[name="uint16"]')[0].value, 39320);
        assert.equal($$('input[name="int16"]')[0].value, -26216);
        assert.equal($$('input[name="uint32"]')[0].value, 2576914326);
        assert.equal($$('input[name="int32"]')[0].value, -1718052970);
        assert.equal($$('input[name="float32"]')[0].value, -1.577765671108354e-23);
        assert.equal($$('input[name="float64"]')[0].value, -2.260783778679649e-185);
        assert.equal($$('input[name="index"]')[0].value, 2);
        assert.equal($$('input[name="hex"]')[0].value, 99);
        assert.equal($$('input[name="octal"]')[0].value, '0231');
        assert.equal($$('input[name="bin"]')[0].value, '10011001');
    });

    it("should displays forms as expected (lil endian)", function() {
        effroi.mouse.click($$('input[name="littleendian"]')[0]);
        assert.equal($$('input[name="uint8"]')[0].value, 153);
        assert.equal($$('input[name="int8"]')[0].value, -103);
        assert.equal($$('input[name="uint16"]')[0].value, 39065);
        assert.equal($$('input[name="int16"]')[0].value, -26471);
        assert.equal($$('input[name="uint32"]')[0].value, 2526517401);
        assert.equal($$('input[name="int32"]')[0].value, -1768449895);
        assert.equal($$('input[name="float32"]')[0].value, -2.449166838197393e-25);
        assert.equal($$('input[name="float64"]')[0].value, -3.466768900908667e-219);
        assert.equal($$('input[name="index"]')[0].value, 2);
        assert.equal($$('input[name="hex"]')[0].value, 99);
        assert.equal($$('input[name="octal"]')[0].value, '0231');
        assert.equal($$('input[name="bin"]')[0].value, '10011001');
    });

});

describe("Paging binary datas", function() {

    it("should allow to view the next page", function() {
        assert.equal($$('nav span')[1].innerHTML,'1/20');
        effroi.mouse.click($$('a[href="app:browse?page=next"]')[0]);
        assert.equal($$('nav span')[1].innerHTML,'2/20');
        assert.equal($$('td.byte a')[0].innerHTML,'9a');
    });

    it("should allow to view the first page", function() {
        effroi.mouse.click($$('a[href="app:browse?page=begin"]')[0]);
        assert.equal($$('nav span')[1].innerHTML,'1/20');
        assert.equal($$('td.byte a')[0].innerHTML,'9b');
    });

    it("should allow to view the last page", function() {
        effroi.mouse.click($$('a[href="app:browse?page=end"]')[0]);
        assert.equal($$('nav span')[1].innerHTML,'20/20');
        assert.equal($$('td.byte a')[0].innerHTML,'88');
    });

    it("should allow to view the previous page", function() {
        effroi.mouse.click($$('a[href="app:browse?page=previous"]')[0]);
        assert.equal($$('nav span')[1].innerHTML,'19/20');
        assert.equal($$('td.byte a')[0].innerHTML,'89');
    });

});
