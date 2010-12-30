if (typeof Template === 'undefined') {
    var Template = {
        renderElements : function(container, elementName, elements, renderFunction) {
            var template = $('.template', container).first().clone();
            resetTemplateContainer();
            $.each(elements, function(index, item) {
                Template.renderTemplate(item, renderFunction, template, container);
            });

            function resetTemplateContainer() {
                $('.' + elementName + ':not(.template)', container).remove();
            }
        },

        renderTemplate : function(item, itemTransformer, itemTemplate, itemsContainer) {
            var itemElement = itemTemplate.clone();
            itemElement.removeClass("template");
            itemTransformer(item, itemElement);
            itemsContainer.append(itemElement);
        },
    };
}