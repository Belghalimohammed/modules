// Add event listener to save items when the page is unloaded or refreshed
window.addEventListener("beforeunload", saveItems);

// Retrieve saved items on page load
window.addEventListener("load", retrieveItems);
// Create item with title, message, and remove button
function createItem(message, top, left, color) {
  var item = document.createElement("div");
  item.classList.add("item");
  item.setAttribute("data-value", message);

  // Set the background color of the item to the color parameter and add a box shadow
  item.style.background = `${color}`;
  // item.style.boxShadow = "15px 36px 80px rgba(0, 0, 0, 0.24) ";

  // Create a new <div> element with the "tape" class and append it to the item
  var scotch = document.createElement("div");
  scotch.classList.add("tape");
  item.appendChild(scotch);

  // Create a new <p> element and set its text content to the message parameter, then append it to the item
  var p = document.createElement("p");
  p.textContent = message;
  // Check if the item background color is light
  // If it is, set the text color to black
  var isLightColor = isLight(color);
  if (isLightColor) {
    p.style.color = "#000000";
  } else {
    p.style.color = "#FFFFFF";
  }

  item.appendChild(p);

  // Create a new <span> element with the "remove-btn" class and set its text content to "X", then append it to the item
  var removeBtn = document.createElement("span");
  removeBtn.classList.add("remove-btn");
  removeBtn.textContent = "X";
  item.appendChild(removeBtn);

  // Make the item draggable and set its position to absolute with the given top and left values
  makeDraggable(item);
  item.style.position = "absolute";
  item.style.top = top + "px";
  item.style.left = left + "px";

  return item;
}
// Function to check if a color is light
function isLight(color) {
  // Convert the color to RGB values
  var rgb = hexToRgb(color);
  if (rgb) {
    // Calculate the luminance value using the relative luminance formula
    var luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    // Compare the luminance value to a threshold (0.5) to determine if it's a light color
    return luminance > 0.5;
  }
  return false;
}

// Function to convert a hexadecimal color code to RGB values
function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Save items to local storage
function saveItems() {
  var items = [];
  var postItDashboard = document.getElementById("post_it_dashboard");

  // Iterate through each item
  var itemElements = postItDashboard.getElementsByClassName("item");
  for (var i = 0; i < itemElements.length; i++) {
    var item = itemElements[i];

    // Get item properties
    var message = item.getElementsByTagName("p")[0].textContent;
    var color = item.style.background;
    var transform = item.style.transform;
    var matches = transform.match(/translate3d\((.+),\s*(.+),\s*(.+)\)/);
    var left = parseInt(matches[1]);
    var top = parseInt(matches[2]);

    // Create item object
    var itemObject = {
      message: message,
      color: color,
      transform: transform,
      top: top,
      left: left,
      text_color: item.getElementsByTagName("p")[0].style.color
      
    };

    // Add item to array
    items.push(itemObject);
  }

  // Save items to local storage
  localStorage.setItem("post_it_items", JSON.stringify(items));
}

// Retrieve items from local storage
function retrieveItems() {
  var items = localStorage.getItem("post_it_items");
  if (items) {
    items = JSON.parse(items);

    // Create and append items to container
    for (var i = 0; i < items.length; i++) {
      var itemObject = items[i];
      var item = createItem(
        itemObject.message,
        225,
        15,
        itemObject.color
      );
      item.style.transform = itemObject.transform;
      // item.dataset.xOffset = itemObject.xOffset; // Added xOffset
      // item.dataset.yOffset = itemObject.yOffset; // Added yOffset
      item.getElementsByTagName("p")[0].style.color = itemObject.text_color
      item.getElementsByTagName("span")[0].style.color = itemObject.text_color
      document.getElementById("post_it_dashboard").appendChild(item);
    }
  }
}

// Make item draggable
function makeDraggable(item, dragZone) {
  var isDragging = false;
  var currentX;
  var currentY;
  var initialX;
  var initialY;
  var xOffset = 0;
  var yOffset = 0;

  if (!dragZone) {
    dragZone = document.getElementById("post_it_dashboard");
  }

  dragZone.addEventListener("mousedown", dragStart);
  dragZone.addEventListener("mouseup", dragEnd);
  dragZone.addEventListener("mousemove", drag);

  function dragStart(e) {
    if (e.target === item || item.contains(e.target)) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === item) {
        isDragging = true;
      }

      item.style.cursor = "grabbing";
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;

    isDragging = false;

    item.style.cursor = "grab";
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      var maxX = dragZone.offsetWidth - item.offsetWidth;
      var maxY = dragZone.offsetHeight - item.offsetHeight;
      currentX = Math.min(Math.max(currentX, 0), maxX);
      currentY = Math.min(Math.max(currentY, 0), maxY);

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, item);
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
  }
}

// Remove item from container
function removeItem(e) {
  if (e.target.classList.contains("remove-btn")) {
    var item = e.target.closest(".item");
    item.parentNode.removeChild(item);

    // Get the value of the deleted item from its data attribute
    var value = item.getAttribute("data-value");

    // Retrieve the items array from localStorage
    var items = JSON.parse(localStorage.getItem("items"));

    // Find the index of the deleted item in the array
    var index = items.indexOf(value);

    // Remove the item from the array
    items.splice(index, 1);

    // Update the items array in localStorage
    localStorage.setItem("items", JSON.stringify(items));
  }
}

// Handle form submit
document.getElementById("myForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent form submission
  var message = document.getElementById("message").value;
  var color = document.getElementById("color").value;

  // Set the initial position of the item
  var top = 225; // Set to desired top position
  var left = 15; // Set to desired left position

  // Create item and add to container
  var item = createItem(message, top, left, color);
  document.getElementById("post_it_dashboard").appendChild(item);

  // Clear form inputs

  document.getElementById("message").value = "";
});

// Handle remove button click
document
  .getElementById("post_it_dashboard")
  .addEventListener("click", removeItem);
