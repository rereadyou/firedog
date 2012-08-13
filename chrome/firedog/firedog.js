FBL.ns(function() { with (FBL) {
    function FiredogPanel() {}
    FiredogPanel.prototype = extend(Firebug.Panel,{
                                      name:"FiredogPanel",
                                      parentPanel: "script",
                                      title: "Firedog",
                                      enableAlly: true,

                                      initialize: function(context, doc)
                                      {
                                          Firebug.Panel.initialize.apply(this, arguments);
                                      },

                                      show: function(state)
                                      {
                                          Firebug.Panel.show.apply(this, arguments);
                                          this.refresh();
                                      },

                                      hide: function()
                                      {
                                          Firebug.Panel.hide.apply(this, arguments);
                                      }
    });

    Firebug.registerPanel(FiredogPanel);

}});