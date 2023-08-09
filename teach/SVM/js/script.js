const slides = document.querySelectorAll(".slide");
let rendered_connectors = new Array(slides.length).fill(false);

function drawConnectors(section) {
    const slide = section.querySelector(".slide");
    const slide_id = Number(slide.getAttribute("slide-id"));

    // if (rendered_connectors[slide_id] == true)
    // return;
    rendered_connectors[slide_id] = true;

    const connectors = slide.querySelectorAll("svg[connector-class]");
    if (connectors.length === 0)
        return;

    // ============== create canvas ==============
    const canvas_id = `connector-canvas${slide_id}`;
    let canvas = slide.querySelector(`#${canvas_id}`);
    if (canvas !== null)
        canvas.parentNode.removeChild(canvas);

    canvas = document.createElement("div");
    canvas.id = canvas_id;
    canvas.style.inlineSize = "100%";
    canvas.style.blockSize = "100%";
    canvas.style.padding = 0;
    canvas.style.margin = 0;
    canvas.style.position = "absolute";
    canvas.style.pointerEvents = "none";
    canvas.style.display = "block";
    canvas.style.zIndex = 5;
    slide.append(canvas);
    const canvas_bounds = canvas.getBoundingClientRect();

    function getPos(svg_bounds, bounds, pos) {
        let x = 0;
        let y = 0;
        if (pos == "top") {
            x = (bounds.right + bounds.left) / 2;
            y = bounds.top;
        }
        else if (pos == "top-right") {
            x = bounds.right;
            y = bounds.top;
        }
        else if (pos == "right") {
            x = bounds.right;
            y = (bounds.bottom + bounds.top) / 2;
        }
        else if (pos == "bottom-right") {
            x = bounds.right;
            y = bounds.bottom;
        }
        else if (pos == "bottom") {
            x = (bounds.right + bounds.left) / 2;
            y = bounds.bottom;
        }
        else if (pos == "bottom-left") {
            x = bounds.left;
            y = bounds.bottom;
        }
        else if (pos == "left") {
            x = bounds.left;
            y = (bounds.bottom + bounds.top) / 2;
        }
        else if (pos == "top-left") {
            x = bounds.left;
            y = bounds.top;
        }
        return { x: x - svg_bounds.x, y: y - svg_bounds.y };
    }

    for (const connector of connectors) {
        // create new connector
        const new_conn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        new_conn.setAttribute("version", 2);
        new_conn.style.position = "absolute";
        new_conn.style.inlineSize = `100%`;
        new_conn.style.blockSize = `100%`;
        new_conn.style.inset = "0 0 0 0";
        new_conn.style.display = "block";
        canvas.append(new_conn);
        const svg_bounds = new_conn.getBoundingClientRect();
        new_conn.setAttribute("viewBox", `0 0 ${svg_bounds.width} ${svg_bounds.height}`);

        const ele_from = document.getElementById(connector.getAttribute("from-id"));
        const pos_from = connector.getAttribute("from-pos");
        const ele_to = document.getElementById(connector.getAttribute("to-id"));
        const pos_to = connector.getAttribute("to-pos");
        let params = connector.getAttribute("path");

        // create path element
        const ele_path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        const class_path = connector.getAttribute("connector-class");
        ele_path.setAttribute("class", class_path);
        const marker_id = `${class_path}-head`;
        ele_path.setAttribute("marker-end", `url(#${marker_id})`);
        new_conn.append(ele_path);

        const scale = Reveal.getScale();
        let from_coord = getPos(svg_bounds, ele_from.getBoundingClientRect(), pos_from); //wrt canvas bounds
        let to_coord = getPos(svg_bounds, ele_to.getBoundingClientRect(), pos_to); //wrt canvas bounds
        const from_offset_x = (Number(connector.getAttribute("from-off-x")) || 0) * scale;
        const from_offset_y = (Number(connector.getAttribute("from-off-y")) || 0) * scale;
        const to_offset_x = (Number(connector.getAttribute("to-off-x")) || 0) * scale;
        const to_offset_y = (Number(connector.getAttribute("to-off-y")) || 0) * scale;
        from_coord.x += from_offset_x;
        from_coord.y += from_offset_y;
        to_coord.x += to_offset_x;
        to_coord.y += to_offset_y;
        const dx = to_coord.x - from_coord.x;
        const dy = to_coord.y - from_coord.y;

        const stroke_width = parseFloat(getComputedStyle(ele_path).strokeWidth) * scale; // muut be in px
        ele_path.style.strokeWidth = stroke_width; // scale correctly if window resizes between events.

        params = params.match(/[vh][^vh]*/g);
        // console.log(`From (${ele_from.id})[${pos_from}]  to (${ele_to.id})[${pos_to}];  path{${params}}`);
        let path_string = `M ${from_coord.x},${from_coord.y} `;
        if (params !== null) {
            for (const param of params) {// assumes only one v or h at the start of string
                const dir = param.match(/[vh]/);
                const percent = Number(param.match(/(?<=[vh])[^vh]*/));
                // console.log(`${dir} has percent ${percent}`);
                if (dir == "v")
                    path_string += `${dir} ${dy * percent / 100} `;
                else if (dir == "h")
                    path_string += `${dir} ${dx * percent / 100} `;
            }
        }
        path_string += `L ${to_coord.x},${to_coord.y}`
        ele_path.setAttribute("d", path_string);

        // remove connector
        // connector.parentNode.removeChild(connector);
    }

}

{
    let slide_id = Number(0);
    let section_name = "";
    let chapter_name = "";
    for (const slide of slides) {
        slide.setAttribute("slide-id", slide_id++);

        // footer
        if (slide.classList.contains("chapter")) {
            let chapter_heading = slide.querySelector(".heading");
            if (chapter_heading !== null) {
                chapter_name = chapter_heading.innerText;
            }
        }
        else if (slide.classList.contains("section")) {
            let section_heading = slide.querySelector(".heading");
            if (section_heading !== null) {
                section_name = section_heading.innerText;
            }
        }


        let footer = slide.querySelector(".footer");
        if (footer !== null) {
            const bar = document.createElement("div");
            bar.className = "bar";
            bar.setAttribute("data-id", "_footer-bar");
            footer.appendChild(bar);
            const copyright = document.createElement("span");
            copyright.innerText = "© National University of Singapore";
            bar.appendChild(copyright);
            const nav = document.createElement("span");
            nav.innerHTML = `${chapter_name} &raquo; ${section_name}`;
            bar.appendChild(nav);
            const slide_num = document.createElement("span");
            slide_num.innerText = slide_id.toString().concat("/", slides.length);
            bar.appendChild(slide_num);
        }

    }
}
