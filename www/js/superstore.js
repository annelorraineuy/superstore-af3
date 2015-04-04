	//global stuff
	var db = createTables();
	var query;
	var onItemID = null; 
	var onAisle = null;

	$(document).ready(function(e) {
		/*
		Find out what is clicked
		$("body").click(function(event) {
			alert(event.target.id+" and "+event.target.className);	
		});*/
		
		$("#searchResults-ul").on("click", "a", function (e) {
    		e.preventDefault();
    		onItemID = $(this).closest("li").attr("id");
		});
		
		$("#searchFieldDiv").on("input", function() {
			if(this.value != "")
				searchItems(this.value);	
		});
		
    });
	
	//start webSQL
	function getOpenDb() { 
		try {
			if (window.openDatabase) {                    
				return window.openDatabase;                  
			} else {
				alert('No HTML5 support');
				return undefined;
			}
		}
		catch (e) {
			alert(e);
			return undefined;
		}            
	}
	
	function createTables() {
		var openDB = getOpenDb();
		
		if(!openDB)
		{                
			return; 
			alert("Error: failed to create database.");              
		}
		else
		{
			db = openDB("superstore_dbc","1.0","Superstore Client Database", 2*1024*1024);
			
			db.transaction(function (t) {
				$.ajax({
						type:"GET",
						async: false,
						url:"data/websql-queries.txt",
						success:function(data){
								query = data.split("\n"); //read the sql queries from text file line by line
								
								for(var i=0; i < query.length; i++)
									t.executeSql(query[i], [], null, databaseError);     
							}
					});
				});
				
			readForJsonExport(); //export database to JSON
			return db;
    	}            
	}
	
	
	function databaseError(err) {
		alert("Error: "+err);
	}
	
	function readForJsonExport() {
		var dataJSON = [];
		db.transaction(function(t) {
			t.executeSql('SELECT * from items', [], function(t, data) {
				for (var i=0; i < data.rows.length; i++)
					dataJSON[i] = data.rows.item(i);
					
				var evaldata = JSON.stringify(dataJSON);
				console.log("currently: "+evaldata);
				
				//get server-side db categories
				$.ajax({
						type:"GET",
						async: false,
						url:"http://www.anneuy.com/superstoreapp2014/category.json",
						success:function(newData){
							console.log("going in categories...");
							//newData = newData.replace(/\\/g, '');
							console.log("unparsed data "+newData);
							newData = $.parseJSON(newData);
							console.log("parsed data "+newData);
							updateCategoriesDB(newData); //update items
						},
						error: function(xhr, status, error) {
						  console.log(arguments);
						  console.log(error);
						},
					});
					
				//get server-side db products
				$.ajax({
						type:"GET",
						async: false,
						url:"http://anneuy.com/superstoreapp2014/product.json",
						success:function(newData){
							console.log("going in products...");
							//newData = newData.replace(/\\/g, '');
							//console.log(newData);
							newData = $.parseJSON(newData);
							console.log(newData);
							updateProductsDB(newData); //update products
						},
						error: function(xhr, status, error) {
						  console.log(arguments);
						  console.log(error);
						},
					});
					
				//get server-side db items
				$.ajax({
						type:"GET",
						async: false,
						url:"http://anneuy.com/superstoreapp2014/item.json",
						success:function(newData){
							newData = newData.replace(/\\/g, '');
							console.log(newData);
							newData = $.parseJSON(newData);
							console.log(newData);
							updateItemsDB(newData); //update items
						},
						error: function(xhr, status, error) {
						  console.log(arguments);
						  console.log(error);
						},
					});
					
				//get server-side db sale items
				$.ajax({
						type:"GET",
						async: false,
						url:"http://www.anneuy.com/superstoreapp2014/saleitem.json",
						success:function(newData){
							console.log("going in sale items...");
							console.log(newData);
							newData = $.parseJSON(newData);
							console.log(newData);
							updateSaleItemsDB(newData); //update items
						},
						error: function(xhr, status, error) {
						  console.log(arguments);
						  console.log(error);
						},
					});
		
			}, databaseError);	
			
		}, databaseError);
	}
	
	function updateCategoriesDB(newData) {
		
		console.log(newData[0].cat_name);
		console.log(newData.length);
		
		var dropCategories = "DROP TABLE category";
		var createCategoryTable = "CREATE TABLE IF NOT EXISTS category(cat_ID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, cat_name VARCHAR(60));";	
		
		db.transaction(function (t) {
			t.executeSql(dropCategories, null, updateCategoryTable, null);
			
			function updateCategoryTable() {
				t.executeSql(createCategoryTable, null, function (t, data) {
					for(var i=0; i < newData.length; i++)
					{
						console.log("came in updateCategories "+newData[i].cat_name);
						var catID = newData[i].cat_ID;
						var catName = newData[i].cat_name;
						
						t.executeSql("INSERT INTO category VALUES (null, '"+catName+"')", null, null, function(t, err) { alert(err); });
					}
				}, null);	
			}
			
		});
	}
	
		function updateProductsDB(newData) {
		
		console.log(newData[0].prod_name);
		console.log(newData.length);
		
		var dropProducts = "DROP TABLE product";
		var createProductTable = "CREATE TABLE IF NOT EXISTS product(prod_ID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, prod_name VARCHAR(60) NOT NULL, aisle_ID VARCHAR(10), shelf_ID VARCHAR(2), cat_ID INTEGER, FOREIGN KEY(cat_ID) REFERENCES category(cat_ID));";	
		
		db.transaction(function (t) {
			t.executeSql(dropProducts, null, updateProductTable, null);
			
			function updateProductTable() {
				t.executeSql(createProductTable, null, function (t, data) {
					for(var i=0; i < newData.length; i++)
					{
						console.log("came in updateProducts "+newData[i].prod_name);
						var prodID = newData[i].prod_ID;
						var prodName = newData[i].prod_name;
						var aisle = newData[i].aisle_ID;
						var shelf = newData[i].shelf_ID;
						var catID = newData[i].cat_ID;
						
						t.executeSql("INSERT INTO product VALUES (null, '"+prodName+"', '"+aisle+"', '"+shelf+"', '"+catID+"')", null, null, function(t, err) { console.log(err); });
					}
				}, null);	
			}
			
		});
	}
	
	function updateItemsDB(newData) {
		
		console.log(newData[0].item_name);
		console.log(newData.length);
		
		var dropItems = "DROP TABLE items";
		var createItemTable = "CREATE TABLE IF NOT EXISTS items(item_ID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, item_name VARCHAR(40) NOT NULL, brand VARCHAR(30), manufacturer VARCHAR(40), quantity INTEGER, price DECIMAL(19, 4) NOT NULL, pic_url VARCHAR(150), prod_ID INTEGER, FOREIGN KEY(prod_ID) REFERENCES product(prod_ID));";	
		
		db.transaction(function (t) {
			t.executeSql(dropItems, null, updateItemTable, null);
			
			function updateItemTable() {
				t.executeSql(createItemTable, null, function (t, data) {
					for(var i=0; i < newData.length; i++)
					{
						console.log("came in updatenewitems ");
						var itemName = newData[i].item_name;
						itemName = itemName.replace("'","''"); //escape ' or other special characters
						console.log("item name is "+newData[i].item_name);
						var itemPrice = newData[i].price;
						console.log("price is "+itemPrice);
						var brand = newData[i].brand;
						if (brand != null)
							brand = brand.replace("'","''");
						console.log("brand is "+brand);
						var manufacturer = newData[i].manufacturer;
						if (manufacturer != null)
							manufacturer =  manufacturer.replace("'","''");
						console.log("manufacturer is "+manufacturer);
						var quantity = newData[i].quantity;
						console.log("qty is "+quantity);
						var itemPic = newData[i].pic_url;
						console.log("item pic is "+itemPic);
						var prod_id = newData[i].prod_ID;
						console.log("prod ID is "+prod_id);
						
						t.executeSql("INSERT INTO items VALUES (null, '"+itemName+"', '"+brand+"', '"+manufacturer+"', '"+quantity+"', '"+itemPrice+"', '"+itemPic+"', '"+prod_id+"')", null, null, function(t, err) { console.log("Update New Items Error: "+err.message); });
					}
				}, null);	
			}
			
		});
		
	}
	
		function updateSaleItemsDB(newData) {
		
		console.log(newData[0].item_ID);
		console.log("sale item table length "+newData.length);
		
		var dropSaleItems = "DROP TABLE saleitems";
		var createSaleItemTable = "CREATE TABLE IF NOT EXISTS saleitems(sale_item_ID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, item_ID INTEGER NOT NULL, sale_price DECIMAL(10, 2) NOT NULL, FOREIGN KEY(item_ID) REFERENCES items(item_ID));";	
		
		db.transaction(function (t) {
			t.executeSql(dropSaleItems, null, updateSaleItemTable, null);
			
			function updateSaleItemTable() {
				t.executeSql(createSaleItemTable, null, function (t, data) {
					for(var i=0; i < newData.length; i++)
					{
						console.log("came in sale items! ");
						var itemID = newData[i].item_ID;
						console.log("item ID is "+newData[i].itemID);
						var saleItemID = newData[i].sale_item_ID;
						console.log("sale item ID is "+saleItemID);
						var sale_price = newData[i].sale_price;
						console.log("sale price is "+sale_price);
						
						t.executeSql("INSERT INTO saleitems VALUES (null, '"+itemID+"', '"+sale_price+"')", null, null, function(t, err) { console.log("Update Sale Items Error: "+err.message); });
					}
				}, null);	
			}
			
		});
		
		loadFeaturedItems(); //load featured items
		//selRows(); //populate list with all items
	}
	
	function selRows() {
    var q = "SELECT * FROM items, product WHERE items.prod_ID = product.prod_ID";
    
    db.readTransaction(function (t) {
        t.executeSql(q, null, function (t, data) {
    		var html = "";
            for (var i = 0; i < data.rows.length; i++) {
				if (data.rows.item(i).shelf_ID != "")
					var	shelf = "SHELF "+data.rows.item(i).shelf_ID.toUpperCase();
				else shelf = "";
                 html += "<li class='resultsItem' id='"+data.rows.item(i).item_ID+"'><a href='#item-page' class='itemLink'><img src='http://www.anneuy.com/superstoreapp2014/"+ data.rows.item(i).pic_url + "' class='item_thumb' /><div class='itemPrice'>$"+data.rows.item(i).price.toFixed(2) +"</div><div class='itemBrand'>" +data.rows.item(i).brand + "</div><div class='nameItem'>" +data.rows.item(i).item_name + "</div><div class='locationDiv'><img src='images/location_icon.svg' class='location_svg' />AISLE "+ucFirst(data.rows.item(i).aisle_ID)+" "+shelf+"</div></a></li>";
			}
            var searchResultsList= document.getElementById("searchResults-ul");
            searchResultsList.innerHTML = html;
        });
    });
	}
	
	function selItem()
	{
		//return header
		returnHeader();
		
			
		if (onItemID != null)
		{
			var q = "SELECT item_ID, pic_url, item_name, aisle_ID, shelf_ID, brand, price, quantity, cat_name FROM items, product, category WHERE items.item_ID=? AND items.prod_ID = product.prod_ID AND product.cat_ID = category.cat_ID";
			db.transaction(function(t) {
				t.executeSql(q, [onItemID], function(t, data) {
					var imageUrl, aisle, shelf, itemName, brandName, price, qty, category;
					
					//get all variables
					imageUrl = "http://www.anneuy.com/superstoreapp2014/"+data.rows.item(0).pic_url;
					itemName = data.rows.item(0).item_name;
					aisle = data.rows.item(0).aisle_ID;
					onAisle = aisle.toString().toLowerCase();
					if (data.rows.item(0).shelf_ID != "")
						shelf = "SHELF "+data.rows.item(0).shelf_ID.toUpperCase();
					else shelf = "";
					brandName = data.rows.item(0).brand;
					price = data.rows.item(0).price.toFixed(2);
					qty = data.rows.item(0).quantity;
					category = data.rows.item(0).cat_name;
					
					//format html
					var formatHtml= "<img src='"+imageUrl+"' class='bigItemPic'><div class='bigItemBrand textCenter upper'>"+brandName+"</div><div class='bigItemName textCenter upper'>"+itemName+"</div><a href='#dedicated-map'><div class='bigLocationDiv'><img src='images/location_ico_bigger.svg' class='bigLocation'>AISLE "+ucFirst(aisle)+" "+shelf+"</div></a><div class='itemDetails'><img src='images/money_icon.svg'>$"+price+"<br><img src='images/weigh_icon.svg'>"+qty+"<br><img src='images/description_icon.svg'>"+category+"</div>";
					
					$(".itemWrapper").html(formatHtml);
				}, function (error) { //on error 
					$(".itemWrapper").html("<br><h2>Sorry for the inconvenience</h2><p>There was an error that occured. Please contact support.</p><br><p> Error: "+error+"</p>");
					});	
			});
		}
	}
	
	function getMapLoc() {
		var map, display;
		
		$("#grayedOutPanel").closest("div#modalContainer").css("padding", 0);	
		$("#grayedOutPanel").closest("div#modalContainer").css("background-color", "rgba(0,0,0,1.00)");
		
		eListenerModal();
		
		switch (onAisle)
		{
			case '1': map = "1.svg"; break;
			case '2': map = "2.svg"; break;
			case '3': map = "3.svg"; break;
			case '4': map = "4.svg"; break;
			case '5': map = "5.svg"; break;
			case '6': map = "6.svg"; break;
			case '7': map = "7.svg"; break;
			case '8': map = "8.svg"; break;
			case '9': map = "9.svg"; break;
			case 'bakery': map = "bakery.svg"; break;
			case 'deli': map = "deli.svg"; break;
			case 'dairy': map = "dairy.svg"; break;
			case 'frozen': map = "frozen.svg"; break;
			case 'joe': map = "joe.svg"; break;
			case 'meat': map = "meat.svg"; break;
			case 'natural': map = "natural.svg"; break;
			case 'produce': map = "produce.svg"; break;
			case 'seafood': map = "seafood.svg"; break;
			default: map= "error"; break;
		}
		
		//error check
		if (map == "error")
		{
			display = "<div class='errorMap'><h2>Sorry for the inconvenience</h2><p>There was an error that occured. Please contact support at superstoreapp@bulldogdev.com and we'll get to fixing this problem right away!</p></div>";
		} else //show map
		{
			display = "<img src='maps/"+map+"' class='dedicatedMap'>";
		}
		//attach to window
		$("#grayedOutPanel").html(display);
	}
	
	function searchItems(keyword) {
		
		keyword = keyword.toLowerCase();
		console.log(keyword);
		
		if (keyword != "")
		{
			var item_ID, imageUrl, prod_ID, itemName, brandName, price;
			var find_query = "SELECT DISTINCT item_ID, item_name, brand, manufacturer, price, prod_ID, pic_url FROM items WHERE item_name LIKE '%"+keyword+"%' OR brand LIKE '%"+keyword+"%'";
				db.transaction(function(t) {
					t.executeSql(find_query, null, function(t, data) {
						$("#searchResults-ul").html("");
						//alert("searched. results number - "+data.rows.length);
						for (var i = 0; i < data.rows.length; i++) {
							prod_ID = data.rows.item(i).prod_ID; 
							imageUrl = "http://www.anneuy.com/superstoreapp2014/"+data.rows.item(i).pic_url;
							itemName = data.rows.item(i).item_name;	
							price = data.rows.item(i).price;	
							item_ID = data.rows.item(i).item_ID;	
							brandName = data.rows.item(i).brand;
								
							//get shelf and aisle info	
							getShelfandAisle(prod_ID, item_ID, imageUrl, itemName, price, brandName);
						} // end of for loop
					
				}, function (error) { //on error 
					$("#searchResults-ul").html("<br><h2>Sorry for the inconvenience</h2><p>There was an error that occured. Please contact support at superstoreapp@bulldogdev.com.</p><br><p> Error: "+error+"</p>");
					});	// end of data 1
			}); // end of data 1
		} //end of if check on keyword
	}
	
	function getShelfandAisle(prod_ID, item_ID, imageUrl, itemName, price, brandName) {
		var html = "";
		db.transaction(function(st) { 
			$("h3").remove();
			var getShelfandAisleQ = "SELECT shelf_ID, aisle_ID FROM product WHERE prod_ID = ?";
			st.executeSql(getShelfandAisleQ, [prod_ID], function(st, data2) {
				if (data2.rows.item(0).shelf_ID != "")
					var	shelf = "SHELF "+data2.rows.item(0).shelf_ID.toUpperCase();
				else shelf = "";
				var aisle = data2.rows.item(0).aisle_ID;
									
				 html += "<li class='resultsItem' id='"+item_ID+"'><a href='#item-page' class='itemLink'><img src='"+ imageUrl+ "' class='item_thumb' /><div class='itemPrice'>$"+price.toFixed(2) +"</div><div class='itemBrand'>" +brandName + "</div><div class='nameItem'>" +itemName+ "</div><div class='locationDiv'><img src='images/location_icon.svg' class='location_svg' />AISLE "+ucFirst(aisle)+" "+shelf+"</div></a></li>";
				$("#searchResults-ul").append(html);
			}); //end of executesql data2
		});// end of db transaction 2	
	}
	
	function ucFirst(string) {
		return string.substring(0, 1).toUpperCase() + string.substring(1).toLowerCase();
	}
	
	/*$.ui.customClickHandler = function (e) {
		console.log(e);
		$(e).css("background-color", "red");
	};
	
	document.addEventListener("loadpanel", function(e) {
		console.log(e);
		//$(e.target).css("background-color", "red");
		$("#background-change").closest("#modalContainer").css("padding", 0);
	}, false);*/
	
	document.addEventListener("swipeRight", function() {
		$.ui.goBack();
	}, false);
	
	function extendHeader() {
		$("#header_no_backbutton").parent().css("height",100);
		$("#header_no_backbutton").css("background-color", "rgb(238, 45, 36)");
	}
	
	function returnHeader() {
		$("#header_backbutton").parent().css("height","");
	}

	function revertModalBgColor() {
		$("#modalContainer").css("background-color", "rgb(255,255,255)");
		eListenerModal();
	}
	
	function eListenerModal() {
		$("#modalContainer").bind("click", function(e) {	
			$.ui.hideModal("");	
		});	
	}
	
	function loadFeaturedItems() {
	$("#searchResults-ul").parent().prepend("<h3>FEATURED SPECIALS</h3>");
    
	var q = "SELECT * FROM saleitems, items, product WHERE saleitems.item_ID = items.item_ID AND items.prod_ID = product.prod_ID";
    
    db.readTransaction(function (t) {
        t.executeSql(q, null, function (t, data) {
    		var html = "";
            for (var i = 0; i < data.rows.length; i++) {
				if (data.rows.item(i).shelf_ID != "")
					var	shelf = "SHELF "+data.rows.item(i).shelf_ID.toUpperCase();
				else shelf = "";
                 html += "<li class='resultsItem' id='"+data.rows.item(i).item_ID+"'><a href='#item-page' class='itemLink'><div class='itemPictureDiv'><img src='http://www.anneuy.com/superstoreapp2014/"+ data.rows.item(i).pic_url + "' class='item_thumb'><img src='images/Sale3.png' class='saleSticker'></div><div class='itemPrice'>$"+data.rows.item(i).price.toFixed(2) +"</div><div class='itemBrand'>" +data.rows.item(i).brand + "</div><div class='nameItem'>" +data.rows.item(i).item_name + "</div><div class='locationDiv'><img src='images/location_icon.svg' class='location_svg' />AISLE "+ucFirst(data.rows.item(i).aisle_ID)+" "+shelf+"</div></a></li>";
			}
            var searchResultsList= document.getElementById("searchResults-ul");
            searchResultsList.innerHTML = html;
        });
    });
	}