
import React from 'react';
import { Clock, Bookmark, ShoppingBag } from 'lucide-react';
import Card from '../../common/Card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FavoritesTabsProps {
  onValueChange: (value: string) => void;
}

const FavoritesTabs: React.FC<FavoritesTabsProps> = ({ onValueChange }) => {
  return (
    <div className="px-6 -mt-6">
      <Card className="p-2">
        <Tabs defaultValue="recent" onValueChange={onValueChange}>
          <TabsList className="w-full bg-gray-100">
            <TabsTrigger value="recent" className="flex-1">
              <Clock size={14} className="mr-1" />
              Recentes
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              <Bookmark size={14} className="mr-1" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="frequent" className="flex-1">
              <ShoppingBag size={14} className="mr-1" />
              Frequentes
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>
    </div>
  );
};

export default FavoritesTabs;
