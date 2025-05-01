
import React, { useState } from 'react';
import { format, addDays, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from '@/components/ui/sonner';

// Mock calendar events
const mockCalendarEvents = [
  { 
    id: '1', 
    title: 'Visita técnica - João Silva', 
    date: new Date('2025-05-03T10:00:00'), 
    type: 'visit', 
    address: 'Rua das Flores, 123 - Centro'
  },
  { 
    id: '2', 
    title: 'Entrega de material', 
    date: new Date('2025-05-04T14:30:00'), 
    type: 'delivery',
    address: 'Av. Paulista, 1000 - Bela Vista'
  },
  { 
    id: '3', 
    title: 'Finalização de obra - Maria Oliveira', 
    date: new Date('2025-05-06T09:00:00'), 
    type: 'completion',
    address: 'Rua dos Pinheiros, 500 - Pinheiros'
  },
];

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  type: 'visit' | 'delivery' | 'completion' | 'meeting';
  address?: string;
};

const ServiceCalendarScreen: React.FC = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [currentDate, setCurrentDate] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  
  // Get today's day name
  const dayName = format(selectedDate || today, 'EEEE', { locale: ptBR });
  const formattedDate = format(selectedDate || today, "dd 'de' MMMM", { locale: ptBR });
  
  // Get events for the selected date
  const selectedDateEvents = events.filter(event => {
    if (!selectedDate) return false;
    return format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });
  
  // Generate week view data
  const generateWeekDays = (currentDate: Date) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(weekStart, i);
      const dayEvents = events.filter(event => 
        format(event.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      return {
        date,
        events: dayEvents,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
        isSelected: selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      };
    });
  };
  
  const weekDays = generateWeekDays(currentDate);
  
  const nextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };
  
  const prevWeek = () => {
    setCurrentDate(addDays(currentDate, -7));
  };
  
  const handleNewEvent = () => {
    toast.info("Funcionalidade de criar novo evento será implementada em breve!");
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    toast.info(`Detalhes do evento: ${event.title}`);
  };
  
  // Get event type color class
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'visit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivery':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completion':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'meeting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Translate event type to Portuguese
  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'visit':
        return 'Visita';
      case 'delivery':
        return 'Entrega';
      case 'completion':
        return 'Conclusão';
      case 'meeting':
        return 'Reunião';
      default:
        return type;
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium capitalize">{dayName}</h3>
          <p className="text-sm text-gray-500 capitalize">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <CalendarIcon size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="default" size="sm" className="h-8" onClick={handleNewEvent}>
            <Plus size={16} className="mr-1" />
            Novo
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-0 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 border-b px-4 py-2">
            <h3 className="font-medium">Semana</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevWeek}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm">
                {format(weekDays[0].date, 'dd/MM', { locale: ptBR })} - {format(weekDays[6].date, 'dd/MM', { locale: ptBR })}
              </span>
              <Button variant="ghost" size="icon" onClick={nextWeek}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
              <div key={i} className="py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[120px]">
            {weekDays.map((day) => (
              <div 
                key={day.date.toString()} 
                className={`p-1 border-r border-b last:border-r-0 h-full min-h-[120px] ${
                  day.isToday ? 'bg-blue-50' : day.isSelected ? 'bg-gray-50' : ''
                }`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className={`text-center py-1 ${
                  day.isToday ? 'font-bold text-construPro-blue' : day.isCurrentMonth ? '' : 'text-gray-400'
                }`}>
                  {format(day.date, 'd')}
                </div>
                <div className="space-y-1">
                  {day.events.length > 0 ? (
                    day.events.slice(0, 2).map(event => (
                      <div 
                        key={event.id}
                        className={`px-1 py-0.5 text-xs rounded truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        {format(event.date, 'HH:mm')} {event.title.substring(0, 12)}{event.title.length > 12 ? '...' : ''}
                      </div>
                    ))
                  ) : null}
                  {day.events.length > 2 && (
                    <div className="text-xs text-center text-gray-500">
                      +{day.events.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <h3 className="font-medium">Eventos para {format(selectedDate || today, 'dd/MM/yyyy', { locale: ptBR })}</h3>
      
      {selectedDateEvents.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {selectedDateEvents.map(event => (
                  <TableRow key={event.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEventClick(event)}>
                    <TableCell className="py-2">
                      <div className="flex items-start">
                        <div className={`px-2 py-1 rounded-md text-xs ${getEventTypeColor(event.type)}`}>
                          {getEventTypeLabel(event.type)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {format(event.date, 'HH:mm')}
                          </p>
                          {event.address && (
                            <p className="text-xs text-gray-500">
                              {event.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">Nenhum evento agendado para este dia.</p>
        </Card>
      )}
    </div>
  );
};

export default ServiceCalendarScreen;
