var Main = 
{
    init: function()
    {
        $('.intro .introductions a').on('click', function(event)
        {
            event.preventDefault();

            var tab = $(this).attr('href');

            $('.intro').find('.introduction').removeClass('introduction-active');
            $('.intro').find(tab).addClass('introduction-active');

            $('.intro').find('a').removeClass('active');

            $(this).addClass('active');
        });

        $('.mp3').on('click', function(event)
        {
            if(!confirm($(this).attr('title')))
            {
                event.preventDefault();

                window.location.href = $(this).data('href');
            }
        });

        $('a.confirm').on('click', function(event)
        {
            event.preventDefault();

            var href = $(this).attr('href');
            var target = $(this).attr('target');
            var modal = $(this).data('modal');

            $(modal + ' .btn-primary').unbind('click').one('click', function(event)
            {
                $(modal).modal('hide');

                if(target === '_blank')
                {
                    window.open(href);
                }
                else
                {
                    location.href = href;
                }
            });

            $(modal).modal('show');
        });

        if(window.location.href.indexOf('?'))
        {
            const location = window.location.href.split('?');
            const params = new URLSearchParams(location[1]);

            if(params.has('highlight'))
            {
                $('main').mark(params.get('highlight'), { exclude: ['.no-mark']});
            }
        }

        if($('#map').length)
        {
            Main.map();
        }

        Main.instances = [];
        $('.data-table-database').each(function()
        {
            Main.instances.push(Main.table($(this)));
        });

        if($('.search.first').length)
        {
            $('.navbar form').on('submit', function(event)
            {
                event.preventDefault();
                var terms = $(this).find('[name="terms"]').val().trim();
                history.pushState(null, '', terms ? '?terms=' + encodeURIComponent(terms) : window.location.pathname);
                Main.search(terms);
            });

            var params = new URLSearchParams(window.location.search);
            if(params.has('terms') && params.get('terms'))
            {
                Main.search(params.get('terms'));
            }
        }

        $('.team.first a').each(function()
        {
            var mail = $(this).next('span.contact').text();

            if(!!mail && mail.indexOf('@') > -1)
            {
                $(this).attr('href', 'mailto:' + mail);
            }
        });
    },

    // https://leafletjs.com/reference-1.6.0.html
    map: function()
    {
        var center = [$('#map').data('latitude') || 41.89305, $('#map').data('longitude') || 12.4827];
        var zoom = $('#map').data('zoom') || 6;
        var map = L.map('map').setView(center, zoom);

        var attribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://cloudmade.com">CloudMade</a>'

        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: attribution,
            maxZoom: 18
        }).addTo(map);

        L.control.scale().addTo(map);

        $('#map .location').each(function()
        {
            var coordinates = [$(this).data('latitude'), $(this).data('longitude')];
            var attributes = {};

            if($(this).attr('title'))
            {
                attributes.title = $(this).attr('title');
            }

            var marker = L.marker(coordinates, attributes).addTo(map);

            if($(this).data('popup'))
            {
                marker.bindPopup($(this).data('popup'));
            }
        });
    },

    // https://datatables.net/examples/basic_init/
    table: function(table)
    {
        var options = {
            "info":     false,
            "mark":     {
                className: 'hightlight',
                exclude: ['.no-mark']
            },
            "order":    [],
            "paging":   false,
            "sort":     true
        };

        options.language = {
            "sEmptyTable":     "Nessun dato presente nella tabella",
            "sInfo":           "Vista da _START_ a _END_ di _TOTAL_ elementi",
            "sInfoEmpty":      "Vista da 0 a 0 di 0 elementi",
            "sInfoFiltered":   "(filtrati da _MAX_ elementi totali)",
            "sInfoPostFix":    "",
            "sInfoThousands":  ".",
            "sLengthMenu":     "Visualizza _MENU_ elementi",
            "sLoadingRecords": "Caricamento...",
            "sProcessing":     "Elaborazione...",
            "sSearch":         "Cerca:",
            "sZeroRecords":    "La ricerca non ha portato alcun risultato.",
            "oPaginate": {
                "sFirst":      "Inizio",
                "sPrevious":   "Precedente",
                "sNext":       "Successivo",
                "sLast":       "Fine"
            },
            "oAria": {
                "sSortAscending":  ": attiva per ordinare la colonna in ordine crescente",
                "sSortDescending": ": attiva per ordinare la colonna in ordine decrescente"
            }
        };

        options.fixedHeader = {
            headerOffset: $('.navbar').outerHeight()
        }

        if(table.data('remote'))
        {
            options.serverSide = true;
            options.ajax = {
                url: table.data('remote'),
                type: 'POST',
                data: {
                    tempo: function() {
                        return $('#filter-tempo').find('option:selected').attr('value');
                    },
                    place: function() {
                        return $('#filter-place').find('option:selected').attr('value');
                    },
                    action: function() {
                        return $('#filter-action').find('option:selected').attr('value');
                    }
                }
            };
        }

        var instance = table.DataTable(options);

        table.parents('.table-container').find('.filters select').on('change', function()
        {
            instance.ajax.reload();
        });

        table.find('tbody').on('click', '.expand', function(event)
        {
            event.preventDefault();

            var tr = $(this).closest('tr');
            var data = tr.data('json');
            var info = '';

            if(data.schedatore !== undefined)
            {
                info += '<div class="expanded">';
                info += '<p class="first"><strong>Schedatrice/tore</strong>:</p>\n<p>' + (data.schedatore || '-') + '</p>';
                info += '<p class="first"><strong>Fonte</strong>:</p>\n' + (data.source || '-');
                info += '<p class="first"><strong>Note</strong>:</p>\n<p>' + (data.notes || '-') + '</p>';
                info += '</div>';
            }

            var row = instance.row( tr );

            if(row.child.isShown())
            {
                row.child.hide();
                tr.removeClass('shown');
            }
            else if(info.length)
            {
                row.child(info).show();
                tr.addClass('shown');
            }
        });

        $('#reset-order').click( function()
        {
            instance.order([ $(this).data('column'), "asc" ]).draw();
        });

        return instance;
    },

    search: function(terms)
    {
        var total = 0;

        Main.instances.forEach(function(dt)
        {
            dt.search(terms).draw();
            var count = dt.rows({ filter: 'applied' }).count();
            var section = $(dt.table().container()).closest('.results');

            if(terms.length > 0 && count > 0)
            {
                section.show();
                total += count;
            }
            else
            {
                section.hide();
            }
        });

        if(terms.length > 0 && total === 0)
        {
            $('.zero-results').show();
        }
        else
        {
            $('.zero-results').hide();
        }
    }
};

$(document).ready(function()
{
    Main.init();
});