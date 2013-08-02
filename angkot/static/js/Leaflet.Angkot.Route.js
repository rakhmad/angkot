L.Angkot.Route = L.LayerGroup.extend({
  options: {
    editable: false,
  },

  initialize: function(layers, options) {
    L.LayerGroup.prototype.initialize.call(this, layers);
    L.Util.setOptions(this, options);

    this._polylines = [];
    this._active = null;
    this._guide = new L.Polyline.Color([], {
      color: 'blue'
    });
    this._shiftKey = false;
  },

  onAdd: function(map) {
    L.LayerGroup.prototype.onAdd.apply(this, arguments);

    if (this.options.editable) {
      this._setupEvents();
      this._guide.addTo(map);
    }
  },

  setEditable: function(editable) {
    this.options.editable = editable;
    if (editable) this._setupEvents();
    else this._removeEvents();

    // FIXME restructure
    if (this._map) {
      if (editable) this._guide.addTo(this._map);
      else this._map.removeLayer(this._guide);
    }
  },

  _setupEvents: function() {
    if (!this._map) return;

    this._map.on('click', this._onMapClick, this);
    this._map.on('mousemove', this._onMapMouseMove, this);

    L.DomEvent.addListener(document, 'keydown', function(e) {
      this._shiftKey = e.shiftKey;
    }, this);
    L.DomEvent.addListener(document, 'keyup', function(e) {
      this._shiftKey = e.shiftKey;
    }, this);
  },

  _removeEvents: function() {
    if (!this._map) return;

    this._map.off('click', this._onMapClick, this);
    this._map.off('mousemove', this._onMapMouseMove, this);
  },

  _onMapClick: function(e) {
    if (this._active) {
      this._active.addLatLng(e.latlng);
      this._guide.spliceLatLngs(0, 1, e.latlng);
    }
    else {
      var p = this._addPolyline();
      p.addLatLng(e.latlng);
      this._active = p;

      this._guide.spliceLatLngs(0, this._guide._latlngs.length);
      this._guide.addLatLng(e.latlng);
      this._guide.addLatLng(e.latlng);
    }
  },

  _onMapMouseMove: function(e) {
    if (this._active) {
      this._guide.spliceLatLngs(1, 1, e.latlng);
    }
  },

  _createPolyline: function() {
    var p = new L.Polyline.Editable([], {
      editable: true,
      color: 'blue',
    });
    return p;
  },

  _addPolyline: function() {
    var p = this._createPolyline();
    p.addTo(this._map);
    p.on('handle:click', this._onHandleClick, this);
    this._polylines.push(p);
    return p;
  },

  _removePolyline: function(p) {
    var index = this._polylines.indexOf(p);
    if (index >= 0) this._polylines.splice(index, 1);

    p.off('handle:click', this._onHandleClick, this);
    if (this._map) this._map.removeLayer(p);
  },

  _onHandleClick: function(e) {
    var p = e.target;
    var length = p._latlngs.length;

    if (e.target == this._active) {
      if (e.vertex === length-1) {
        this._active.setColor('red');
        this._active = null;

        this._guide.spliceLatLngs(0, this._guide._latlngs.length);
      }
    }
    else if (e.vertex === 0 || e.vertex === length-1) {
      if (!this._active) {
        if (e.vertex === 0) {
          p.reverseLatLngs();
        }
        this._active = p;
        this._active.setColor('blue');
        this._guide.addLatLng(e.latlng);
        this._guide.addLatLng(e.latlng);
      }
      else if (this._shiftKey) {
        if (e.vertex === length-1) {
          p.reverseLatLngs();
        }

        this._active.addLatLngs(p._latlngs);
        this._active.setColor('red');
        this._active = null;

        this._removePolyline(p);

        this._guide.spliceLatLngs(0, this._guide._latlngs.length);
      }
    }
  },
});
