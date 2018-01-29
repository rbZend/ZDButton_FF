function detectSettings() {
    var result = $.get("http://127.0.0.1:20080/?ZendServer=9.2").done(
            function(data) {
                var seria = data.replace(/'/g, '"').split("=");
                settings = JSON.parse(seria[1].trim());
                $("#ip").val(settings["debug_host"]);
                $("#port").val(settings["debug_port"]);
            }
    ).fail(
        function() {alert(":(\n\nZend Studio is not responding. Make sure it's started before you try again.")}
    );
}
$("#detect").on("click", detectSettings);

function saveSettings() {
    localStorage.setItem("ip", $('#ip').val());
    localStorage.setItem("port", $('#port').val());
    localStorage.setItem("local", $('#local').is(':checked'));
    localStorage.setItem("stop", $('#stop').is(':checked'));
    $("#save").addClass("btn-outline-secondary");
    $("#save").text("saving ...");
    setTimeout(function(){
        $("#save").removeClass("btn-outline-secondary");
        $("#save").text("save as defaults");
    },600);
}
$("#save").on("click", saveSettings);

function getSettings() {
    $('#ip').val(localStorage.ip);
    if ($('#ip').val() == "") {
        $('#ip').val("127.0.0.1");
        $('#port').val("10137");
        $('#local').prop("checked", true);
        $('#stop').prop("checked", true);
    } else {
        $('#port').val(localStorage.port);
        $('#local').prop("checked", (localStorage.local == 'true'));
        $('#stop').prop("checked", (localStorage.stop == 'true'));
    }
}

function getActiveTab() {
    return browser.tabs.query({active: true, currentWindow: true});
}

function paintButtons(cookies) {
    for (let cookie of cookies) {
        console.log(cookie);
        if (cookie.name == "debug_jit" && cookie.value == "1") {
            $("#debugNext").addClass("btn-info").removeClass("btn-outline-info");
        } else {
            $("#debugNext").removeClass("btn-info").addClass("btn-outline-info");
        }

        if (cookie.name == "debug_start_session" && cookie.value == "1") {
            $("#debugAll").addClass("btn-warning").removeClass("btn-outline-warning");
        } else {
            $("#debugAll").removeClass("btn-warning").addClass("btn-outline-warning");
        }
    }
}

function checkButtons() {
    var modeNext = browser.cookies.getAll({
      name: "debug_jit"
    });
    modeNext.then(paintButtons);

    var modeAll = browser.cookies.getAll({
      name: "debug_start_session"
    });
    modeAll.then(paintButtons);
}

getSettings();
checkButtons();

function cookieSet(url, list) {
    var cookies = JSON.parse("{" + list + "}");
    for (var cookie in cookies){
        browser.cookies.set({
            url: url,
            path: "/",
            name: cookie,
            value: cookies[cookie][0],
            expirationDate: cookies[cookie][1]
        });
    }
}

function setCommon(expires) {
    var list = '"use_remote": ["-",123456789],';
    list += '"no_remote": ["-",123456789],';
    list += '"debug_host": ["' + $('#ip').val() +'",' + expires + '],';
    list += '"debug_port": ["' + $('#port').val() +'",' + expires + '],';
    if ($('#local').is(':checked')) {
        list += '"use_remote": ["1",' + expires + '],';
    } else {
        list += '"no_remote": ["1",' + expires + '],';
    }
    if ($('#stop').is(':checked')) {
        list += '"debug_stop": ["1",' + expires + '],';
    } else {
        list += '"debug_stop": ["-",123456789],';
    }
    list += '"debug_fastfile": ["1",' + expires + '],';
    //list += '"debug_no_cache": ["1",' + expires + '],';
    //list += '"send_sess_end": ["1",' + expires + '],';
    list += '"start_debug": ["1",' + expires + '],';
    list += '"ZRayDisable": ["1",' + expires + '],';

    return list;
}

function setThis() {
    unSet();
    getActiveTab().then((tabs) => {
        var list = setCommon(2345678910);
        list += '"original_url": ["' + tabs[0].url + '",2345678910],';
        list += '"debug_new_session": ["1",2345678910],';
        list += '"debug_jit": ["1",2345678910]';
        cookieSet(tabs[0].url, list);
        browser.tabs.reload(tabs[0].id);
    });
    $("#debugNext").removeClass("btn-info").addClass("btn-outline-info");
    $("#debugAll").removeClass("btn-warning").addClass("btn-outline-warning");
}
$("#debugThis").on("click", setThis);

function setNext() {
    unSet();
    getActiveTab().then((tabs) => {
        var list = setCommon(2345678910);
        list += '"original_url": ["' + tabs[0].url + '",2345678910],';
        list += '"debug_new_session": ["1",2345678910],';
        list += '"debug_jit": ["1",2345678910]';
        cookieSet(tabs[0].url, list);
    });
    $("#debugNext").addClass("btn-info").removeClass("btn-outline-info");
    $("#debugAll").removeClass("btn-warning").addClass("btn-outline-warning");
}
$("#debugNext").on("click", setNext);

function setAll() {
    unSet();
    getActiveTab().then((tabs) => {
        var list = setCommon(2345678910);
        list += '"original_url": ["' + tabs[0].url + '",2345678910],';
        list += '"debug_start_session": ["1",2345678910]';
        cookieSet(tabs[0].url, list);
    });
    $("#debugAll").addClass("btn-warning").removeClass("btn-outline-warning");
    $("#debugNext").removeClass("btn-info").addClass("btn-outline-info");
}
$("#debugAll").on("click", setAll);

function unSet() {
    getActiveTab().then((tabs) => {
        var list = setCommon(123456789);
        list += '"original_url": ["-",123456789],"debug_new_session": ["-",123456789],';
        list += '"debug_jit": ["-",123456789],"debug_start_session": ["-",123456789],';
        list += '"ZendDebuggerCookie": ["-",123456789],"ZRayDisable": ["-",123456789]';
        cookieSet(tabs[0].url, list);
    });
    $("#debugNext").removeClass("btn-info").addClass("btn-outline-info");
    $("#debugAll").removeClass("btn-warning").addClass("btn-outline-warning");
}
$("#debugUnset").on("click", unSet);
