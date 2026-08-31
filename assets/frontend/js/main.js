var Main =
{
    searchIndex: null,
    searchIds: {},
    currentTerms: '',
    exactSearch: true,

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

        $.fn.dataTable.ext.search.push(function(settings, data, index)
        {
            if(!Main.currentTerms || !Main.searchIndex) return true;

            var section = $(settings.nTable).data('section') || $(settings.nTable).closest('.results').data('section');
            var ids = Main.searchIds[section];
            if(ids === undefined) return true;

            var nTr = settings.aoData[index] ? settings.aoData[index].nTr : null;
            return nTr ? ids.has(nTr.id) : false;
        });

        Main.instances = [];
        $('.data-table-database').each(function()
        {
            Main.instances.push(Main.table($(this)));
        });

        if($('.data-table-database').length)
        {
            fetch('/ricerca/index.json')
                .then(function(r) { return r.json(); })
                .then(function(data)
                {
                    Main.searchIndex = lunr.Index.load(data);
                    if(Main.currentTerms) Main.search(Main.currentTerms);
                })
                .catch(function(e)
                {
                    console.error('Search index failed to load:', e);
                });
        }

        var resizeTimer;
        $(window).on('resize', function()
        {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function()
            {
                var isMobile = window.innerWidth < 992;
                Main.instances.forEach(function(dt)
                {
                    if(!dt.fixedHeader) return;
                    if (isMobile) {
                        dt.fixedHeader.disable();
                    } else {
                        dt.fixedHeader.enable();
                        dt.fixedHeader.adjust();
                    }
                });
            }, 150);
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
            "autoWidth": false,
            "info":      false,
            "mark":      {
                className: 'hightlight',
                exclude: ['.no-mark']
            },
            "order":     [],
            "paging":    false,
            "sort":      true
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

        if (window.innerWidth >= 992 && table.closest(':hidden').length === 0) {
            options.fixedHeader = {
                headerOffset: $('.navbar').outerHeight()
            };
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

        var sectionAttr = table.data('section');
        if(sectionAttr && !$('.search.first').length)
        {
            var $input = table.closest('.dataTables_wrapper').find('.dataTables_filter input');
            $input.off('.DT').on('keyup', function()
            {
                var term = $(this).val().trim();
                Main.currentTerms = term;
                Main.searchIds = {};

                if(term && Main.searchIndex)
                {
                    var variants = Main.termVariants(term);
                    var query = variants.map(function(v) { return Main.exactSearch ? v : v + '~1'; }).join(' ');
                    var results = [];
                    try { results = Main.searchIndex.search(query); } catch(e) {}

                    Main.searchIds[sectionAttr] = new Set();
                    results.forEach(function(r)
                    {
                        var sep = r.ref.indexOf(':');
                        if(r.ref.substring(0, sep) === sectionAttr)
                        {
                            Main.searchIds[sectionAttr].add(r.ref.substring(sep + 1));
                        }
                    });

                    instance.search('').draw();
                }
                else
                {
                    instance.search(term).draw();
                }
            });
        }

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
                if(Main.currentTerms)
                {
                    row.child().find('.expanded').mark(Main.currentTerms, { className: 'highlight', exclude: ['.no-mark'] });
                }
            }
        });

        $('#reset-order').click( function()
        {
            instance.order([ $(this).data('column'), "asc" ]).draw();
        });

        table.on('draw.dt', function()
        {
            var term = Main.currentTerms;

            table.find('tbody').unmark();
            if(term)
            {
                table.find('tbody').mark(term, { className: 'highlight', exclude: ['.no-mark'] });
            }

            table.find('tbody a[href^="/"]').each(function()
            {
                var $a = $(this);
                if(!$a.data('href'))
                {
                    var clean = new URL($a.attr('href'), window.location.origin);
                    clean.searchParams.delete('highlight');
                    $a.data('href', clean.pathname + clean.search);
                }
                var url = new URL($a.data('href'), window.location.origin);
                if(term)
                {
                    url.searchParams.set('highlight', term);
                }
                $a.attr('href', url.pathname + url.search);
            });
        });

        return instance;
    },

    search: function(terms)
    {
        terms = terms ? terms.trim() : '';
        Main.currentTerms = terms;
        Main.searchIds = {};

        if(terms && Main.searchIndex)
        {
            Main.instances.forEach(function(dt)
            {
                var s = $(dt.table().node()).data('section') || $(dt.table().node()).closest('.results').data('section');
                if(s) Main.searchIds[s] = new Set();
            });

            var variants = Main.termVariants(terms);
            var query = variants.map(function(v) { return Main.exactSearch ? v : v + '~1'; }).join(' ');
            var results = [];
            try { results = Main.searchIndex.search(query); } catch(e) { console.error('lunr search error:', e, query); }

            results.forEach(function(r)
            {
                var sep = r.ref.indexOf(':');
                var section = r.ref.substring(0, sep);
                var id = r.ref.substring(sep + 1);
                if(Main.searchIds[section]) Main.searchIds[section].add(id);
            });
        }

        var total = 0;

        Main.instances.forEach(function(dt)
        {
            if(terms && !Main.searchIndex)
            {
                dt.search(terms).draw();
            }
            else
            {
                dt.search('').draw();
            }

            var count = dt.rows({ filter: 'applied' }).count();
            var section = $(dt.table().container()).closest('.results');

            if(terms.length > 0 && count > 0)
            {
                section.show();
                section.find('h1 small').text(function(_, text) { return text.replace(/\d+/, count); });
                dt.columns.adjust();
                if(dt.fixedHeader && window.innerWidth >= 992) dt.fixedHeader.enable();
                total += count;
            }
            else
            {
                section.hide();
            }
        });

        $('.zero-results').toggle(terms.length > 0 && total === 0);
    },

    termVariants: function(terms)
    {
        var pairs = [['i','j'],['j','i'],['u','v'],['v','u']];
        var seen = {};
        var result = [];

        terms.toLowerCase().split(/\s+/).filter(function(t) { return t.length >= 2; })
            .forEach(function(term)
            {
                var group = [term];
                pairs.forEach(function(pair)
                {
                    var current = term;
                    while(current.indexOf(pair[0]) !== -1)
                    {
                        current = current.replace(pair[0], pair[1]);
                        if(group.indexOf(current) === -1) group.push(current);
                    }
                });
                group.forEach(function(v)
                {
                    if(!seen[v]) { seen[v] = true; result.push(v); }
                });
            });

        return result;
    }
};

$(document).ready(function()
{
    Main.init();
});