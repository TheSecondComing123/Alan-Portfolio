let windows = document.getElementsByClassName("window");

function switchWindow(window) {
    for (let i = 0; i < windows.length; i++) {
        windows[i].style.display = "none";
    }

    document.getElementById(window).style.display = "block";
    console.log("Switched to " + window);
}

switchWindow("home");
