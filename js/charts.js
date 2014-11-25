var charts = function(result) {
    var client = {};

    var column_names = result.field_names

    var create_selector = function(label, options) {
        var form_group = $("<div>").attr("class", "form-group");
        form_group.append("<label>"+label+"</label>");
        var selector = $("<select>");
        selector.attr("class", "form-control");
        options.forEach(function(o) {
            var input = $("<option>")
                .attr("value", o)
                .text(o);
            selector.append(input);
        });
        form_group.append(selector);
        return form_group;
    }

    var showPieMenu = function() {
        $("#chartXCol").find("label").text("Column for categories");
        $("#chartYCol").find("label").text("Column for values");
        $("#chart_options").show();
    }

    var showScatterMenu = function() {
        $("#chartXCol").find("label").text("x values");
        $("#chartYCol").find("label").text("y values");
        $("#chart_options").show();
    }
 
    client.openModal = function() {
        var modalTitle = $("#dialogBox").find(".modal-title").text("Create a chart");
        var modalBody = $("#dialogBox").find(".modal-body").html("");
        var selector = create_selector("Chart type", ["(Select chart type)", "Pie chart", "Bar chart", "Scatterplot"]);
        selector.change(function() { 
            var val = selector.find(":selected").first().attr("value");
            $("#chart_options").hide();
            switch(val) {
                case "Pie chart":
                case "Bar chart":
                    showPieMenu();
                    break;
                case "Scatterplot":
                    showScatterMenu();
                    break;
            }
        });
        modalBody.append(selector);

        var chart_form = $("<form id='chart_options'></form>");
        chart_form.append(create_selector("", column_names).attr("id", "chartXCol"));
        chart_form.append(create_selector("", column_names).attr("id", "chartYCol"));
        modalBody.append(chart_form);
        chart_form.hide();

        var makeChart = function() {
            var val = selector.find(":selected").first().attr("value");
            console.log(val);
        }
        $("#go_button").click(makeChart);
        $(".close_button").click(function() {
            modalBody.html("");
            modalTitle.text("");
            $("#go_button").unbind("click", makeChart);
        });
    }
    return client;
};
