import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckCircle2, AlertTriangle, AlertCircle, Info, MoreHorizontal, MessageSquare, Play } from "lucide-react"

export default function DesignSystem() {
  const { toast } = useToast()

  return (
    <div className="container mx-auto p-8 space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-display font-bold">ConectaCRM Design System</h1>
        <p className="text-muted-foreground text-lg">
          Tesis: "Del caos al control." Componentes con alta densidad, calma y precisión.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">1. Tipografía</h2>
        <div className="space-y-6">
          <div>
            <div className="text-4xl font-display font-bold text-foreground">Instrument Sans (Display)</div>
            <p className="text-muted-foreground">Usada para títulos H1/H2, números grandes.</p>
          </div>
          <div>
            <div className="text-base text-foreground">IBM Plex Sans (UI / Body)</div>
            <p className="text-muted-foreground">Usada para toda la interfaz, muy legible, sin distracciones.</p>
          </div>
          <div>
            <div className="font-mono text-foreground text-sm">IBM Plex Mono (Data / Mono)</div>
            <p className="text-muted-foreground">Usada para IDs, timestamps y código.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">2. Colores y Semántica</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 rounded-md bg-background border flex items-center justify-center font-mono text-xs">--background</div>
          <div className="h-24 rounded-md bg-card border flex items-center justify-center font-mono text-xs">--card</div>
          <div className="h-24 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-mono text-xs">--primary</div>
          <div className="h-24 rounded-md bg-accent text-accent-foreground flex items-center justify-center font-mono text-xs">--accent</div>
          <div className="h-24 rounded-md bg-success text-white flex items-center justify-center font-mono text-xs">--success</div>
          <div className="h-24 rounded-md bg-warning text-white flex items-center justify-center font-mono text-xs">--warning</div>
          <div className="h-24 rounded-md bg-destructive text-white flex items-center justify-center font-mono text-xs">--danger (destructive)</div>
          <div className="h-24 rounded-md bg-info text-white flex items-center justify-center font-mono text-xs">--info</div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="h-16 rounded-md bg-channel-wa text-white flex items-center justify-center font-mono text-xs font-semibold">WhatsApp</div>
          <div className="h-16 rounded-md bg-channel-ig text-white flex items-center justify-center font-mono text-xs font-semibold">Instagram</div>
          <div className="h-16 rounded-md bg-channel-tg text-white flex items-center justify-center font-mono text-xs font-semibold">Telegram</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">3. Botones (Buttons)</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Con ícono
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">4. Inputs y Controles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium">Input Default</label>
            <Input placeholder="Escribe aquí..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-destructive">Input Error</label>
            <Input className="border-destructive" placeholder="Dato inválido" />
            <p className="text-xs text-destructive">Este campo es requerido.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emprende">Plan Emprende</SelectItem>
                <SelectItem value="crece">Plan Crece</SelectItem>
                <SelectItem value="escala">Plan Escala</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Textarea</label>
            <Textarea placeholder="Escribe tu mensaje..." />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Acepto los términos y condiciones
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <label htmlFor="airplane-mode" className="text-sm font-medium">
              Activar auto-respuesta
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">5. Badges</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Badge className="bg-success text-white hover:bg-success/80">
            <CheckCircle2 className="w-3 h-3 mr-1" /> SLA OK
          </Badge>
          <Badge className="bg-warning text-white hover:bg-warning/80">
            <AlertTriangle className="w-3 h-3 mr-1" /> Por vencer
          </Badge>
          <Badge className="bg-destructive text-white hover:bg-destructive/80">
            <AlertCircle className="w-3 h-3 mr-1" /> Vencido
          </Badge>
          <Badge className="bg-info text-white hover:bg-info/80">
            <Info className="w-3 h-3 mr-1" /> Info
          </Badge>
          <Badge variant="outline" className="border-primary text-primary">
            Plan Crece
          </Badge>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">6. Datos Complejos (Card, Table, Tabs)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Cuenta</CardTitle>
              <CardDescription>Uso de IA y canales del mes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Mensajes IA</span>
                <span className="font-mono font-medium">4,520 / 5,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Tickets Resueltos</span>
                <span className="font-mono font-medium">142</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Actualizar Plan</Button>
            </CardFooter>
          </Card>

          <Tabs defaultValue="inbox">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="contacts">Contactos</TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="p-4 border rounded-md mt-2 bg-card">
              Vista de Bandeja Unificada
            </TabsContent>
            <TabsContent value="kanban" className="p-4 border rounded-md mt-2 bg-card">
              Vista de Pipeline de Ventas
            </TabsContent>
            <TabsContent value="contacts" className="p-4 border rounded-md mt-2 bg-card">
              Directorio de Clientes
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID TICKET</TableHead>
                <TableHead>CLIENTE</TableHead>
                <TableHead>ESTADO SLA</TableHead>
                <TableHead className="text-right">TIEMPO ESPERA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">#T-8924</TableCell>
                <TableCell className="font-medium">Acme Corp</TableCell>
                <TableCell>
                  <Badge className="bg-success text-white hover:bg-success/80">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-data">04:12</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">#T-8925</TableCell>
                <TableCell className="font-medium">Globex</TableCell>
                <TableCell>
                  <Badge className="bg-destructive text-white hover:bg-destructive/80">
                    <AlertCircle className="w-3 h-3 mr-1" /> Incumplido
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-data">14:55</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">7. Interacción (Dialog, Dropdown, Tooltip, Toast)</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir Modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Confirmar acción?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer y borrará permanentemente los datos del cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive">Confirmar Borrado</Button>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Acciones de Ticket</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Asignar a mí</DropdownMenuItem>
              <DropdownMenuItem>Marcar como resuelto</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Eliminar ticket</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>El tiempo SLA empieza a contar desde el primer mensaje.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: "Ticket asignado",
                description: "Se te ha asignado el ticket #T-8924 exitosamente.",
              })
            }}
          >
            Mostrar Toast
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">8. Carga y Estados Vacíos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 p-4 border rounded-md">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <Skeleton className="h-[125px] w-full rounded-xl" />
          </div>
          
          <EmptyState 
            icon={MessageSquare}
            title="Bandeja Vacía"
            description="¡Excelente trabajo! Has respondido a todos los mensajes pendientes de tus clientes."
            action={<Button>Ir al Dashboard</Button>}
          />
        </div>
      </section>
      
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-semibold border-b pb-2">Avatar</h2>
        <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">AG</AvatarFallback>
            </Avatar>
        </div>
      </section>

    </div>
  )
}
