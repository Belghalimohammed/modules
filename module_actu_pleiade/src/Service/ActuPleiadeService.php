<?php

namespace Drupal\module_actu_pleiade\Service;

use SimplePie\SimplePie;

class ActuPleiadeService
{
    private $collectivite;
    private $collectivite_info;
    private $settings_actu;
    public function __construct()
    {
        $this->collectivite = \Drupal::request()->getSession()->get('cas_attributes')["partner"][0];
        $this->collectivite_info = \Drupal::keyValue("collectivities_store")->get('global', [])[$this->collectivite];
        $this->settings_actu = \Drupal::config('module_actu_pleiade.settings');
    }

    public function getList()
    {
        $link = $this->settings_actu->get('url_site');
        $collectivite_default = "sitiv";
        $array_sitiv = $this->getActu($collectivite_default, $link);
        if ($this->collectivite != "sitiv") {
            $array_collectivite = $this->getActu($this->collectivite, $this->collectivite_info['actu_url']);
            $array = $this->interleaveArrays($array_sitiv, $array_collectivite);
            return $array;
        } 
        $array_collectivite = $this->getActu("TNO", \Drupal::keyValue("collectivities_store")->get('global', [])["TNO"]['actu_url']);
        $array = $this->interleaveArrays($array_sitiv, $array_collectivite);
        return $array;

       
    }
    public function getActu($collectivite, $link)
    {
        $proxy = $this->settings_actu->get('proxy'); // 'http://192.168.76.3:3128';
            $feed = new SimplePie();
        $feed->set_feed_url($link);
        $feed->set_curl_options([
            CURLOPT_PROXY => $proxy,
        ]);
        $feed->set_useragent('Mozilla/5.0 (compatible; SimplePie/1.5.8; +https://simplepie.org/)');
        $feed->enable_cache(false);
        $feed->init();
        $feed->handle_content_type();

        if ($feed->error()) {
            return [];
        }

        $max = 20;
        $count = 0;
        $data = [];
        foreach ($feed->get_items() as $item) {
            if ($count++ >= $max) break;

            $created = $item->get_date('d-m-Y');
            $title = $item->get_title();
            $link = $item->get_permalink();
          
            $image = null;

            $enclosure = $item->get_enclosure();
            if ($enclosure && $enclosure->get_type() && strpos($enclosure->get_type(), 'image/') === 0) {
                $image = $enclosure->get_link();
            }

            if (!$image) {
                $description = $item->get_description();
                if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $description, $matches)) {
                    $image = $matches[1];
                }
            }

            if (!$image) {
                $content_encoded = $item->get_item_tags('http://purl.org/rss/1.0/modules/content/', 'encoded');
                if ($content_encoded && isset($content_encoded[0]['data'])) {
                    $html = $content_encoded[0]['data'];
                    if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $matches)) {
                        $image = $matches[1];
                    }
                }
            }

            if (!$image) {

                $image = $this->collectivite_info["logo"];
            }

            $actu = [
                "created" => $created,
                "field_image" => $image,
               
                "title" => $title,
                "view_node" => $link,
                "collectivite" => $collectivite
            ];

            $data[] = $actu;
        }
        return $data;
    }

    function interleaveArrays(array $array1, array $array2): array
    {
        $result = [];
        $count = max(count($array1), count($array2));
        for ($i = 0; $i < $count; $i++) {
            if (array_key_exists($i, $array1)) {
                $result[] = $array1[$i];
            }
            if (array_key_exists($i, $array2)) {
                $result[] = $array2[$i];
            }
        }
        return $result;
    }
}
